-- =====================================================================
-- data/01_seed.sql
-- Sports Club Management System — Phase 5 Seed Data
-- Owner: Richard Yemoh (Data and Query Lead)
--
-- Insert order follows FK dependency: parent tables first, then tables
-- that reference them, then the two weak/junction entities last.
-- Run after schema/01_create_database.sql and schema/02_tables.sql.
-- =====================================================================

USE sports_club;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE team_competition;
TRUNCATE TABLE team_roster;
TRUNCATE TABLE facility_booking;
TRUNCATE TABLE payment;
TRUNCATE TABLE app_user;
TRUNCATE TABLE team;
TRUNCATE TABLE membership;
TRUNCATE TABLE competition;
TRUNCATE TABLE facility;
TRUNCATE TABLE coach;
TRUNCATE TABLE athlete;
TRUNCATE TABLE sport;
TRUNCATE TABLE membership_type;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. membership_type (parent, no FKs)
-- ---------------------------------------------------------------------
INSERT INTO membership_type (type_id, type_name, fee, duration_months, description) VALUES
(1, 'Monthly',    50.00,  1, 'Rolling monthly membership'),
(2, 'Quarterly',  140.00, 3, 'Three-month membership, billed once'),
(3, 'Annual',     500.00, 12,'Full year membership at a discounted rate'),
(4, 'Student',    30.00,  1, 'Discounted monthly rate for enrolled students');

-- ---------------------------------------------------------------------
-- 2. sport (parent, no FKs)
-- ---------------------------------------------------------------------
INSERT INTO sport (sport_id, sport_name, description) VALUES
(1, 'Football',   'Outdoor 11-a-side football'),
(2, 'Basketball', 'Indoor competitive basketball'),
(3, 'Swimming',   'Pool-based individual and relay swimming'),
(4, 'Athletics',  'Track and field events'),
(5, 'Volleyball', 'Indoor and outdoor volleyball'),
(6, 'Tennis',     'Singles and doubles tennis');

-- ---------------------------------------------------------------------
-- 3. athlete (parent, no FKs) — 25 records, mixed genders and ages
-- ---------------------------------------------------------------------
INSERT INTO athlete (athlete_id, first_name, last_name, date_of_birth, gender, email, phone, join_date) VALUES
(1,  'Kwabena', 'Osei',      '2001-03-14', 'Male',   'kwabena.osei@mail.com',    '0244000001', '2023-01-10'),
(2,  'Akosua',  'Frimpong',  '2002-07-22', 'Female', 'akosua.frimpong@mail.com', '0244000002', '2023-01-12'),
(3,  'Yaw',     'Adjei',     '1999-11-05', 'Male',   'yaw.adjei@mail.com',       '0244000003', '2023-01-15'),
(4,  'Efua',    'Mensah',    '2003-02-18', 'Female', 'efua.mensah@mail.com',     '0244000004', '2023-01-15'),
(5,  'Kojo',    'Boateng',   '2000-09-09', 'Male',   'kojo.boateng@mail.com',    '0244000005', '2023-02-01'),
(6,  'Adjoa',   'Asante',    '2001-12-30', 'Female', 'adjoa.asante@mail.com',    '0244000006', '2023-02-03'),
(7,  'Kwame',   'Owusu',     '1998-05-11', 'Male',   'kwame.owusu@mail.com',     '0244000007', '2023-02-10'),
(8,  'Abena',   'Darko',     '2004-01-25', 'Female', NULL,                       '0244000008', '2023-02-14'),
(9,  'Kwesi',   'Appiah',    '2000-06-19', 'Male',   'kwesi.appiah@mail.com',    '0244000009', '2023-03-01'),
(10, 'Ama',     'Nyarko',    '2002-10-02', 'Female', 'ama.nyarko@mail.com',      '0244000010', '2023-03-05'),
(11, 'Kofi',    'Sarpong',   '1997-08-08', 'Male',   'kofi.sarpong@mail.com',    '0244000011', '2023-03-12'),
(12, 'Esi',     'Twumasi',   '2003-04-27', 'Female', 'esi.twumasi@mail.com',     '0244000012', '2023-03-20'),
(13, 'Kwaku',   'Amponsah',  '1999-01-16', 'Male',   'kwaku.amponsah@mail.com',  '0244000013', '2023-04-01'),
(14, 'Afia',    'Gyasi',     '2001-07-07', 'Female', NULL,                       '0244000014', '2023-04-04'),
(15, 'Fiifi',   'Danso',     '2000-03-23', 'Male',   'fiifi.danso@mail.com',     '0244000015', '2023-04-10'),
(16, 'Akua',    'Baffour',   '2002-11-14', 'Female', 'akua.baffour@mail.com',    '0244000016', '2023-05-01'),
(17, 'Nana',    'Yeboah',    '1998-09-30', 'Male',   'nana.yeboah@mail.com',     '0244000017', '2023-05-08'),
(18, 'Adwoa',   'Kusi',      '2003-06-12', 'Female', 'adwoa.kusi@mail.com',      '0244000018', '2023-05-15'),
(19, 'Kwabena', 'Ansah',     '2001-02-05', 'Male',   'kwabena.ansah@mail.com',   '0244000019', '2023-06-01'),
(20, 'Yaa',     'Opoku',     '2004-08-19', 'Female', 'yaa.opoku@mail.com',       '0244000020', '2023-06-10'),
(21, 'Kobby',   'Acheampong','2000-12-01', 'Male',   'kobby.acheampong@mail.com','0244000021', '2023-07-01'),
(22, 'Araba',   'Quaye',     '2002-05-28', 'Female', 'araba.quaye@mail.com',     '0244000022', '2023-07-05'),
(23, 'Sena',    'Tetteh',    '1999-10-17', 'Other',  'sena.tetteh@mail.com',     '0244000023', '2023-08-01'),
(24, 'Kwadwo',  'Nkrumah',   '2001-04-09', 'Male',   'kwadwo.nkrumah@mail.com',  '0244000024', '2023-08-15'),
(25, 'Baaba',   'Amoah',     '2003-09-21', 'Female', 'baaba.amoah@mail.com',     '0244000025', '2023-09-01');

-- ---------------------------------------------------------------------
-- 4. coach (parent, no FKs) — 8 records
-- ---------------------------------------------------------------------
INSERT INTO coach (coach_id, first_name, last_name, specialty, email, phone, hire_date) VALUES
(1, 'Kwame',  'Mensah',   'Football',   'kwame.mensah.coach@mail.com',   '0201000001', '2019-03-01'),
(2, 'Ama',    'Boateng',  'Basketball', 'ama.boateng.coach@mail.com',    '0201000002', '2020-06-15'),
(3, 'Kofi',   'Owusu',    'Swimming',   'kofi.owusu.coach@mail.com',     '0201000003', '2018-01-10'),
(4, 'Efua',   'Asante',   'Athletics',  'efua.asante.coach@mail.com',    '0201000004', '2021-09-01'),
(5, 'Yaw',    'Darko',    'Volleyball', 'yaw.darko.coach@mail.com',      '0201000005', '2020-02-20'),
(6, 'Abena',  'Nyarko',   'Tennis',     'abena.nyarko.coach@mail.com',   '0201000006', '2019-11-05'),
(7, 'Kojo',   'Appiah',   'Football',   'kojo.appiah.coach@mail.com',    '0201000007', '2022-04-01'),
(8, 'Adjoa',  'Sarpong',  'Basketball', 'adjoa.sarpong.coach@mail.com',  '0201000008', '2021-07-19');

-- ---------------------------------------------------------------------
-- 5. facility (parent, no FKs) — 8 records, includes Maintenance/Closed
-- ---------------------------------------------------------------------
INSERT INTO facility (facility_id, facility_name, facility_type, capacity, location, status) VALUES
(1, 'Main Court A',      'Court', 100, 'North Wing',       'Available'),
(2, 'Main Court B',      'Court', 100, 'North Wing',       'Available'),
(3, 'Field 1',           'Field', 500, 'East Grounds',     'Available'),
(4, 'Field 2',           'Field', 500, 'East Grounds',     'Maintenance'),
(5, 'Olympic Pool',      'Pool',  150, 'Aquatics Block',   'Available'),
(6, 'Fitness Gym',       'Gym',   60,  'West Wing',        'Available'),
(7, 'Athletics Track',   'Track', 300, 'South Grounds',    'Available'),
(8, 'Community Hall',    'Hall',  200, 'Main Building',    'Closed');

-- ---------------------------------------------------------------------
-- 6. competition (parent, no FKs) — 8 records, varied levels
-- ---------------------------------------------------------------------
INSERT INTO competition (competition_id, comp_name, comp_date, venue, level, registration_deadline) VALUES
(1, 'Regional Football Cup',            '2026-09-15', 'Accra Sports Stadium',   'Regional',      '2026-08-30'),
(2, 'National Swimming Championship',   '2026-10-05', 'National Aquatic Centre','National',      '2026-09-20'),
(3, 'Local Basketball League',          '2026-08-25', 'Ashesi Sports Hall',     'Local',         '2026-08-15'),
(4, 'International Athletics Meet',     '2026-11-01', 'Kumasi Stadium',        'International', '2026-10-10'),
(5, 'Local Volleyball Tournament',      '2026-09-01', 'Community Hall',        'Local',         '2026-08-20'),
(6, 'National Tennis Open',             '2026-10-20', 'Accra Tennis Club',     'National',      '2026-10-01'),
(7, 'Regional Basketball Championship', '2026-12-01', 'Tema Sports Complex',   'Regional',      '2026-11-15'),
(8, 'Local Football Friendly',          '2026-08-20', 'Field 1',               'Local',         NULL);

-- ---------------------------------------------------------------------
-- 7. membership (depends on athlete, membership_type)
-- 28 records: covers Active / Expired / Suspended, and a few athletes
-- with a lapsed membership followed by a renewal (new row, per BR1 note).
-- ---------------------------------------------------------------------
INSERT INTO membership (membership_id, athlete_id, type_id, start_date, end_date, amount_charged, status) VALUES
(1,  1,  3, '2025-01-10', '2026-01-10', 500.00, 'Active'),
(2,  2,  1, '2026-06-01', '2026-07-01', 50.00,  'Active'),
(3,  3,  2, '2026-05-15', '2026-08-15', 140.00, 'Active'),
(4,  4,  3, '2024-06-01', '2025-06-01', 500.00, 'Expired'),
(5,  4,  3, '2025-06-05', '2026-06-05', 500.00, 'Active'),
(6,  5,  1, '2026-07-01', '2026-08-01', 50.00,  'Active'),
(7,  6,  4, '2026-06-10', '2026-07-10', 30.00,  'Expired'),
(8,  6,  4, '2026-07-12', '2026-08-12', 30.00,  'Active'),
(9,  7,  2, '2026-04-01', '2026-07-01', 140.00, 'Expired'),
(10, 8,  1, '2026-07-15', '2026-08-15', 50.00,  'Active'),
(11, 9,  3, '2025-09-01', '2026-09-01', 500.00, 'Active'),
(12, 10, 4, '2026-07-01', '2026-08-01', 30.00,  'Suspended'),
(13, 11, 1, '2026-06-20', '2026-07-20', 50.00,  'Expired'),
(14, 12, 2, '2026-05-01', '2026-08-01', 140.00, 'Active'),
(15, 13, 3, '2025-02-01', '2026-02-01', 500.00, 'Expired'),
(16, 13, 3, '2026-02-05', '2027-02-05', 500.00, 'Active'),
(17, 14, 1, '2026-07-20', '2026-08-20', 50.00,  'Active'),
(18, 15, 4, '2026-06-15', '2026-07-15', 30.00,  'Suspended'),
(19, 16, 2, '2026-04-10', '2026-07-10', 140.00, 'Expired'),
(20, 17, 3, '2025-11-01', '2026-11-01', 500.00, 'Active'),
(21, 18, 1, '2026-07-05', '2026-08-05', 50.00,  'Active'),
(22, 19, 4, '2026-06-01', '2026-07-01', 30.00,  'Expired'),
(23, 20, 2, '2026-05-20', '2026-08-20', 140.00, 'Active'),
(24, 21, 3, '2025-12-01', '2026-12-01', 500.00, 'Active'),
(25, 22, 1, '2026-07-10', '2026-08-10', 50.00,  'Active'),
(26, 23, 4, '2026-06-25', '2026-07-25', 30.00,  'Suspended'),
(27, 24, 2, '2026-05-01', '2026-08-01', 140.00, 'Active'),
(28, 25, 3, '2025-10-01', '2026-10-01', 500.00, 'Active');

-- ---------------------------------------------------------------------
-- 8. team (depends on sport, coach) — 10 records
-- ---------------------------------------------------------------------
INSERT INTO team (team_id, team_name, sport_id, coach_id, founded_date) VALUES
(1,  'Thunder FC',       1, 1, '2019-04-01'),
(2,  'Lightning FC',     1, 7, '2022-05-01'),
(3,  'Hoops Elite',      2, 2, '2020-07-01'),
(4,  'Rim Rockers',      2, 8, '2021-08-01'),
(5,  'Aqua Sharks',      3, 3, '2018-02-01'),
(6,  'Sprint Squad',     4, 4, '2021-10-01'),
(7,  'Spike Force',      5, 5, '2020-03-01'),
(8,  'Ace Netters',      6, 6, '2019-12-01'),
(9,  'Junior Ballers',   2, 8, '2023-01-01'),
(10, 'Rising Stars FC',  1, 1, '2023-06-01');

-- ---------------------------------------------------------------------
-- 9. app_user (depends on coach, nullable) — 12 records
-- Passwords are placeholder bcrypt-style hashes; Ronald owns real hashing (NFR2).
-- ---------------------------------------------------------------------
INSERT INTO app_user (user_id, username, password_hash, role, coach_id, is_active, last_login) VALUES
(1,  'admin1',        '$2y$10$placeholderhash0000000000000000000000000000000000001', 'Admin',     NULL, 1, '2026-08-10 09:15:00'),
(2,  'admin2',        '$2y$10$placeholderhash0000000000000000000000000000000000002', 'Admin',     NULL, 1, '2026-08-09 14:02:00'),
(3,  'frontdesk1',    '$2y$10$placeholderhash0000000000000000000000000000000000003', 'FrontDesk', NULL, 1, '2026-08-11 08:00:00'),
(4,  'frontdesk2',    '$2y$10$placeholderhash0000000000000000000000000000000000004', 'FrontDesk', NULL, 1, '2026-08-10 17:45:00'),
(5,  'coach.mensah',  '$2y$10$placeholderhash0000000000000000000000000000000000005', 'Coach',     1,    1, '2026-08-08 10:30:00'),
(6,  'coach.boateng', '$2y$10$placeholderhash0000000000000000000000000000000000006', 'Coach',     2,    1, '2026-08-07 11:00:00'),
(7,  'coach.owusu',   '$2y$10$placeholderhash0000000000000000000000000000000000007', 'Coach',     3,    1, '2026-08-06 09:20:00'),
(8,  'coach.asante',  '$2y$10$placeholderhash0000000000000000000000000000000000008', 'Coach',     4,    1, NULL),
(9,  'coach.darko',   '$2y$10$placeholderhash0000000000000000000000000000000000009', 'Coach',     5,    1, '2026-08-05 16:10:00'),
(10, 'coach.nyarko',  '$2y$10$placeholderhash0000000000000000000000000000000000010', 'Coach',     6,    1, NULL),
(11, 'coach.appiah',  '$2y$10$placeholderhash0000000000000000000000000000000000011', 'Coach',     7,    0, '2026-06-01 12:00:00'),
(12, 'coach.sarpong', '$2y$10$placeholderhash0000000000000000000000000000000000012', 'Coach',     8,    1, '2026-08-11 07:50:00');

-- ---------------------------------------------------------------------
-- 10. payment (depends on membership) — 32 records
-- Covers Completed, Pending, Failed, Refunded and multiple methods.
-- ---------------------------------------------------------------------
INSERT INTO payment (payment_id, membership_id, amount, payment_date, method, status, reference_no) VALUES
(1,  1,  500.00, '2025-01-10 09:00:00', 'Bank Transfer', 'Completed', 'REF0001'),
(2,  2,  50.00,  '2026-06-01 10:15:00', 'Mobile Money',  'Completed', 'REF0002'),
(3,  3,  140.00, '2026-05-15 11:00:00', 'Card',          'Completed', 'REF0003'),
(4,  4,  500.00, '2024-06-01 09:30:00', 'Cash',          'Completed', 'REF0004'),
(5,  5,  500.00, '2025-06-05 09:45:00', 'Bank Transfer', 'Completed', 'REF0005'),
(6,  6,  50.00,  '2026-07-01 08:50:00', 'Mobile Money',  'Completed', 'REF0006'),
(7,  7,  30.00,  '2026-06-10 10:00:00', 'Cash',          'Completed', 'REF0007'),
(8,  8,  30.00,  '2026-07-12 10:05:00', 'Mobile Money',  'Pending',   'REF0008'),
(9,  9,  140.00, '2026-04-01 12:00:00', 'Card',          'Completed', 'REF0009'),
(10, 10, 50.00,  '2026-07-15 09:10:00', 'Cash',          'Pending',   'REF0010'),
(11, 11, 500.00, '2025-09-01 09:00:00', 'Bank Transfer', 'Completed', 'REF0011'),
(12, 12, 30.00,  '2026-07-01 13:00:00', 'Mobile Money',  'Failed',    'REF0012'),
(13, 13, 50.00,  '2026-06-20 08:40:00', 'Cash',          'Completed', 'REF0013'),
(14, 14, 140.00, '2026-05-01 09:25:00', 'Card',          'Completed', 'REF0014'),
(15, 15, 500.00, '2025-02-01 09:00:00', 'Bank Transfer', 'Completed', 'REF0015'),
(16, 16, 500.00, '2026-02-05 09:00:00', 'Bank Transfer', 'Completed', 'REF0016'),
(17, 17, 50.00,  '2026-07-20 14:15:00', 'Mobile Money',  'Pending',   'REF0017'),
(18, 18, 30.00,  '2026-06-15 10:00:00', 'Cash',          'Refunded',  'REF0018'),
(19, 19, 140.00, '2026-04-10 11:30:00', 'Card',          'Completed', 'REF0019'),
(20, 20, 500.00, '2025-11-01 09:00:00', 'Bank Transfer', 'Completed', 'REF0020'),
(21, 21, 50.00,  '2026-07-05 09:05:00', 'Mobile Money',  'Completed', 'REF0021'),
(22, 22, 30.00,  '2026-06-01 08:30:00', 'Cash',          'Completed', 'REF0022'),
(23, 23, 140.00, '2026-05-20 10:45:00', 'Card',          'Completed', 'REF0023'),
(24, 24, 500.00, '2025-12-01 09:00:00', 'Bank Transfer', 'Completed', 'REF0024'),
(25, 25, 50.00,  '2026-07-10 09:15:00', 'Mobile Money',  'Pending',   'REF0025'),
(26, 26, 30.00,  '2026-06-25 12:20:00', 'Cash',          'Failed',    'REF0026'),
(27, 27, 140.00, '2026-05-01 09:50:00', 'Card',          'Completed', 'REF0027'),
(28, 28, 500.00, '2025-10-01 09:00:00', 'Bank Transfer', 'Completed', 'REF0028'),
(29, 9,  140.00, '2026-04-05 09:00:00', 'Cash',          'Refunded',  'REF0029'),
(30, 19, 140.00, '2026-04-12 09:00:00', 'Mobile Money',  'Failed',    'REF0030'),
(31, 12, 30.00,  '2026-07-03 09:00:00', 'Card',          'Pending',   'REF0031'),
(32, 23, 140.00, '2026-05-22 09:00:00', 'Mobile Money',  'Completed', 'REF0032');

-- ---------------------------------------------------------------------
-- 11. facility_booking (depends on facility, team) — 26 records
-- Same facility booked across different dates/slots (no duplicate slot).
-- ---------------------------------------------------------------------
INSERT INTO facility_booking (booking_id, facility_id, team_id, booking_date, time_slot, purpose, status, created_at) VALUES
(1,  3, 1,  '2026-08-12', '06:00-08:00', 'Training',        'Confirmed', '2026-08-01 09:00:00'),
(2,  3, 2,  '2026-08-12', '08:00-10:00', 'Training',        'Confirmed', '2026-08-01 09:05:00'),
(3,  3, 1,  '2026-08-14', '06:00-08:00', 'Training',        'Confirmed', '2026-08-02 09:00:00'),
(4,  1, 3,  '2026-08-12', '10:00-12:00', 'Practice match',  'Confirmed', '2026-08-01 10:00:00'),
(5,  1, 4,  '2026-08-12', '12:00-14:00', 'Practice match',  'Confirmed', '2026-08-01 10:10:00'),
(6,  2, 9,  '2026-08-13', '08:00-10:00', 'Training',        'Confirmed', '2026-08-02 10:00:00'),
(7,  2, 3,  '2026-08-13', '10:00-12:00', 'Training',        'Confirmed', '2026-08-02 10:05:00'),
(8,  5, 5,  '2026-08-12', '06:00-08:00', 'Swim training',   'Confirmed', '2026-08-01 07:00:00'),
(9,  5, 5,  '2026-08-14', '06:00-08:00', 'Swim training',   'Confirmed', '2026-08-03 07:00:00'),
(10, 7, 6,  '2026-08-12', '14:00-16:00', 'Track session',   'Confirmed', '2026-08-01 11:00:00'),
(11, 7, 6,  '2026-08-15', '14:00-16:00', 'Track session',   'Confirmed', '2026-08-04 11:00:00'),
(12, 8, 7,  '2026-08-13', '16:00-18:00', 'Volleyball drill','Cancelled', '2026-08-02 12:00:00'),
(13, 1, 8,  '2026-08-13', '18:00-20:00', 'Tennis coaching', 'Confirmed', '2026-08-02 12:30:00'),
(14, 6, 1,  '2026-08-14', '08:00-10:00', 'Strength & conditioning', 'Confirmed', '2026-08-03 08:00:00'),
(15, 6, 3,  '2026-08-14', '10:00-12:00', 'Strength & conditioning', 'Confirmed', '2026-08-03 08:05:00'),
(16, 3, 2,  '2026-08-15', '06:00-08:00', 'Training',        'Confirmed', '2026-08-04 09:00:00'),
(17, 3, 10, '2026-08-15', '08:00-10:00', 'Training',        'Confirmed', '2026-08-04 09:05:00'),
(18, 1, 4,  '2026-08-16', '10:00-12:00', 'Practice match',  'Confirmed', '2026-08-05 10:00:00'),
(19, 2, 9,  '2026-08-16', '12:00-14:00', 'Training',        'Confirmed', '2026-08-05 10:05:00'),
(20, 5, 5,  '2026-08-17', '06:00-08:00', 'Swim training',   'Confirmed', '2026-08-06 07:00:00'),
(21, 7, 6,  '2026-08-18', '14:00-16:00', 'Track session',   'Confirmed', '2026-08-07 11:00:00'),
(22, 1, 8,  '2026-08-18', '18:00-20:00', 'Tennis coaching', 'Confirmed', '2026-08-07 12:00:00'),
(23, 3, 1,  '2026-08-19', '06:00-08:00', 'Friendly setup',  'Confirmed', '2026-08-08 09:00:00'),
(24, 6, 10, '2026-08-19', '08:00-10:00', 'Strength & conditioning', 'Confirmed', '2026-08-08 09:10:00'),
(25, 2, 3,  '2026-08-20', '10:00-12:00', 'Training',        'Cancelled', '2026-08-09 09:00:00'),
(26, 3, 2,  '2026-08-20', '06:00-08:00', 'Training',        'Confirmed', '2026-08-09 09:05:00');

-- ---------------------------------------------------------------------
-- 12. team_roster (weak entity: depends on team, athlete) — 30 records
-- A few athletes appear on more than one team (e.g. multi-sport athletes).
-- ---------------------------------------------------------------------
INSERT INTO team_roster (team_id, athlete_id, date_joined, position, is_active) VALUES
(1, 1,  '2023-01-15', 'Midfielder',   1),
(1, 3,  '2023-01-20', 'Forward',      1),
(1, 5,  '2023-02-05', 'Defender',     1),
(1, 7,  '2023-02-15', 'Goalkeeper',   1),
(1, 9,  '2023-03-02', 'Forward',      0),
(2, 11, '2023-03-15', 'Midfielder',   1),
(2, 13, '2023-04-05', 'Defender',     1),
(2, 15, '2023-04-12', 'Forward',      1),
(3, 2,  '2023-01-18', 'Guard',        1),
(3, 4,  '2023-01-22', 'Forward',      1),
(3, 6,  '2023-02-06', 'Center',       1),
(4, 8,  '2023-02-16', 'Guard',        1),
(4, 10, '2023-03-06', 'Forward',      1),
(4, 12, '2023-03-22', 'Guard',        0),
(5, 14, '2023-04-06', 'Freestyle',    1),
(5, 16, '2023-05-02', 'Backstroke',   1),
(5, 18, '2023-05-16', 'Butterfly',    1),
(6, 17, '2023-05-09', 'Sprinter',     1),
(6, 19, '2023-06-02', 'Long-distance',1),
(6, 21, '2023-07-02', 'Sprinter',     1),
(7, 20, '2023-06-11', 'Setter',       1),
(7, 22, '2023-07-06', 'Spiker',       1),
(8, 23, '2023-08-02', 'Singles',      1),
(8, 25, '2023-09-02', 'Doubles',      1),
(9, 24, '2023-08-16', 'Guard',        1),
(9, 6,  '2023-08-20', 'Forward',      1),
(10,1,  '2023-06-05', 'Forward',      1),
(10,9,  '2023-06-10', 'Midfielder',   1),
(2, 24, '2023-06-15', 'Forward',      1),
(3, 9,  '2023-09-01', 'Forward',      0);

-- ---------------------------------------------------------------------
-- 13. team_competition (weak entity: depends on team, competition) — 20 records
-- ---------------------------------------------------------------------
INSERT INTO team_competition (team_id, competition_id, registration_date, final_position, points_scored) VALUES
(1,  1, '2026-08-01', NULL, NULL),
(2,  1, '2026-08-02', NULL, NULL),
(10, 1, '2026-08-05', NULL, NULL),
(1,  8, '2026-08-01', 1,    9),
(2,  8, '2026-08-01', 2,    6),
(10, 8, '2026-08-01', 3,    3),
(3,  3, '2026-08-01', NULL, NULL),
(4,  3, '2026-08-02', NULL, NULL),
(9,  3, '2026-08-03', NULL, NULL),
(3,  7, '2026-08-10', NULL, NULL),
(4,  7, '2026-08-11', NULL, NULL),
(2,  7, '2026-08-12', NULL, NULL),
(9,  7, '2026-08-13', NULL, NULL),
(5,  2, '2026-08-01', NULL, NULL),
(6,  4, '2026-08-01', NULL, NULL),
(7,  5, '2026-08-01', 1,    45),
(8,  6, '2026-08-01', 2,    NULL);
