-- Sports Club Management System - Phase 6b Triggers
-- Owner: Samira Donkoh
-- Target: MariaDB 10.x / XAMPP

USE sports_club;

DROP TRIGGER IF EXISTS trg_roster_requires_active_membership;
DROP TRIGGER IF EXISTS trg_membership_one_active_insert;
DROP TRIGGER IF EXISTS trg_membership_one_active_update;

DELIMITER //

-- BR1: an athlete must have a current active membership before joining a team.
CREATE TRIGGER trg_roster_requires_active_membership
BEFORE INSERT ON team_roster
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM membership
         WHERE athlete_id = NEW.athlete_id
           AND status = 'Active'
           AND CURDATE() BETWEEN start_date AND end_date
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Athlete requires a current active membership before joining a team';
    END IF;
END //

-- An athlete cannot begin a second active membership while another active
-- membership exists. This preserves a clean membership history.
CREATE TRIGGER trg_membership_one_active_insert
BEFORE INSERT ON membership
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' AND EXISTS (
        SELECT 1
          FROM membership
         WHERE athlete_id = NEW.athlete_id
           AND status = 'Active'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An athlete cannot hold more than one active membership';
    END IF;
END //

-- The same rule must be checked on UPDATE. Without this trigger, a membership
-- row inserted as Expired could later be changed to Active and bypass the rule.
CREATE TRIGGER trg_membership_one_active_update
BEFORE UPDATE ON membership
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' AND EXISTS (
        SELECT 1
          FROM membership
         WHERE athlete_id = NEW.athlete_id
           AND status = 'Active'
           AND membership_id <> OLD.membership_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An athlete cannot hold more than one active membership';
    END IF;
END //

DELIMITER ;
