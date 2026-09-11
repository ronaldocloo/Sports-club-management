-- Sports Club Management System - Phase 6b Database Programming
-- Owner: Samira Donkoh
-- Target: MariaDB 10.x / XAMPP

USE sports_club;

DROP PROCEDURE IF EXISTS sp_register_athlete_with_membership;
DROP PROCEDURE IF EXISTS sp_renew_membership;
DROP PROCEDURE IF EXISTS sp_record_payment;
DROP FUNCTION IF EXISTS fn_membership_outstanding_balance;
DROP FUNCTION IF EXISTS fn_athlete_age;
DROP FUNCTION IF EXISTS fn_team_active_roster_count;

DELIMITER //

CREATE PROCEDURE sp_register_athlete_with_membership(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_date_of_birth DATE,
    IN p_gender VARCHAR(10),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_type_id INT,
    IN p_start_date DATE,
    IN p_payment_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(20),
    IN p_reference_no VARCHAR(50)
)
BEGIN
    DECLARE v_duration_months INT;
    DECLARE v_fee DECIMAL(10,2);
    DECLARE v_athlete_id INT;
    DECLARE v_membership_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_first_name IS NULL OR p_last_name IS NULL OR p_date_of_birth IS NULL
       OR p_phone IS NULL OR p_type_id IS NULL OR p_start_date IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Required registration values are missing';
    END IF;

    IF p_gender NOT IN ('Male', 'Female', 'Other') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid athlete gender';
    END IF;

    IF p_payment_amount IS NULL OR p_payment_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'First payment amount must be positive';
    END IF;

    IF p_payment_method NOT IN ('Cash', 'Card', 'Bank Transfer', 'Mobile Money') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid payment method';
    END IF;

    SELECT duration_months, fee
      INTO v_duration_months, v_fee
      FROM membership_type
     WHERE type_id = p_type_id;

    IF v_duration_months IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership type does not exist';
    END IF;

    IF p_payment_amount > v_fee THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'First payment cannot exceed membership amount charged';
    END IF;

    START TRANSACTION;

    INSERT INTO athlete (first_name, last_name, date_of_birth, gender, email, phone, join_date)
    VALUES (p_first_name, p_last_name, p_date_of_birth, p_gender, p_email, p_phone, p_start_date);
    SET v_athlete_id = LAST_INSERT_ID();

    INSERT INTO membership (athlete_id, type_id, start_date, end_date, amount_charged, status)
    VALUES (v_athlete_id, p_type_id, p_start_date,
            DATE_ADD(p_start_date, INTERVAL v_duration_months MONTH), v_fee, 'Active');
    SET v_membership_id = LAST_INSERT_ID();

    INSERT INTO payment (membership_id, amount, payment_date, method, status, reference_no)
    VALUES (v_membership_id, p_payment_amount, NOW(), p_payment_method, 'Completed', p_reference_no);

    COMMIT;

    SELECT v_athlete_id AS athlete_id, v_membership_id AS membership_id,
           v_fee AS amount_charged, p_payment_amount AS initial_payment;
END //

CREATE PROCEDURE sp_renew_membership(
    IN p_athlete_id INT,
    IN p_type_id INT,
    IN p_start_date DATE
)
BEGIN
    DECLARE v_duration_months INT;
    DECLARE v_fee DECIMAL(10,2);
    DECLARE v_membership_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF NOT EXISTS (SELECT 1 FROM athlete WHERE athlete_id = p_athlete_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Athlete does not exist';
    END IF;

    SELECT duration_months, fee
      INTO v_duration_months, v_fee
      FROM membership_type
     WHERE type_id = p_type_id;

    IF v_duration_months IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership type does not exist';
    END IF;

    START TRANSACTION;

    -- Historical memberships are retained; renewal is a new row, never an edit.
    -- End any current active membership first, so the new renewal is the only
    -- active membership and the trigger's invariant remains true.
    UPDATE membership
       SET status = 'Expired'
     WHERE athlete_id = p_athlete_id
       AND status = 'Active';

    INSERT INTO membership (athlete_id, type_id, start_date, end_date, amount_charged, status)
    VALUES (p_athlete_id, p_type_id, p_start_date,
            DATE_ADD(p_start_date, INTERVAL v_duration_months MONTH), v_fee, 'Active');
    SET v_membership_id = LAST_INSERT_ID();

    COMMIT;
    SELECT v_membership_id AS membership_id, v_fee AS amount_charged;
END //

CREATE PROCEDURE sp_record_payment(
    IN p_membership_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(20),
    IN p_reference_no VARCHAR(50)
)
BEGIN
    DECLARE v_amount_charged DECIMAL(10,2);
    DECLARE v_paid_so_far DECIMAL(10,2);

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount must be positive';
    END IF;

    IF p_method NOT IN ('Cash', 'Card', 'Bank Transfer', 'Mobile Money') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid payment method';
    END IF;

    SELECT amount_charged
      INTO v_amount_charged
      FROM membership
     WHERE membership_id = p_membership_id;

    IF v_amount_charged IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership does not exist';
    END IF;

    IF p_reference_no IS NOT NULL
       AND EXISTS (SELECT 1 FROM payment WHERE reference_no = p_reference_no) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment reference number already exists';
    END IF;

    SELECT COALESCE(SUM(amount), 0)
      INTO v_paid_so_far
      FROM payment
     WHERE membership_id = p_membership_id
       AND status = 'Completed';

    IF v_paid_so_far + p_amount > v_amount_charged THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment would exceed membership amount charged';
    END IF;

    INSERT INTO payment (membership_id, amount, payment_date, method, status, reference_no)
    VALUES (p_membership_id, p_amount, NOW(), p_method, 'Completed', p_reference_no);

    SELECT LAST_INSERT_ID() AS payment_id;
END //

CREATE FUNCTION fn_membership_outstanding_balance(p_membership_id INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_amount_charged DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);

    SELECT amount_charged INTO v_amount_charged
      FROM membership WHERE membership_id = p_membership_id;

    IF v_amount_charged IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
      FROM payment
     WHERE membership_id = p_membership_id
       AND status = 'Completed';

    RETURN GREATEST(v_amount_charged - v_paid, 0);
END //

CREATE FUNCTION fn_athlete_age(p_athlete_id INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_date_of_birth DATE;

    SELECT date_of_birth INTO v_date_of_birth
      FROM athlete WHERE athlete_id = p_athlete_id;

    IF v_date_of_birth IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN TIMESTAMPDIFF(YEAR, v_date_of_birth, CURDATE());
END //

CREATE FUNCTION fn_team_active_roster_count(p_team_id INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count
      FROM team_roster
     WHERE team_id = p_team_id
       AND is_active = TRUE;

    RETURN v_count;
END //

DELIMITER ;
