create table membership_type (
    type_id int auto_increment primary key,
    type_name varchar(50) not null unique,
    fee decimal(10,2) not null,
    duration_months int not null,
    description varchar(255) null,
    constraint chk_membership_type_fee_nonneg check (fee >= 0),
    constraint chk_membership_type_duration_positive check (duration_months > 0)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table sport (
    sport_id int auto_increment primary key,
    sport_name varchar(50) not null unique,
    description varchar(255) null
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table athlete (
    athlete_id int auto_increment primary key,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    date_of_birth date not null,
    gender enum('Male','Female','Other') not null,
    email varchar(100) null,
    phone varchar(20) not null,
    join_date date not null default current_date
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table coach (
    coach_id int auto_increment primary key,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    specialty varchar(50) not null,
    email varchar(100) not null unique,
    phone varchar(20) not null,
    hire_date date not null
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table facility (
    facility_id int auto_increment primary key,
    facility_name varchar(100) not null unique,
    facility_type enum('Court','Field','Pool','Gym','Track','Hall') not null,
    capacity int not null,
    location varchar(100) null,
    status enum('Available','Maintenance','Closed') not null default 'Available',
    constraint chk_facility_capacity_positive check (capacity > 0)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table competition (
    competition_id int auto_increment primary key,
    comp_name varchar(100) not null,
    comp_date date not null,
    venue varchar(100) null,
    level enum('Local','Regional','National','International') not null,
    registration_deadline date null
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table membership (
    membership_id int auto_increment primary key,
    athlete_id int not null,
    type_id int not null,
    start_date date not null,
    end_date date not null,
    amount_charged decimal(10,2) not null,
    status enum('Active','Expired','Suspended') not null default 'Active',
    constraint fk_membership_athlete foreign key (athlete_id) references athlete(athlete_id) on delete restrict on update cascade,
    constraint fk_membership_type foreign key (type_id) references membership_type(type_id) on delete restrict on update cascade,
    constraint chk_membership_amount_nonneg check (amount_charged >= 0),
    constraint chk_membership_dates check (end_date > start_date)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table team (
    team_id int auto_increment primary key,
    team_name varchar(100) not null unique,
    sport_id int not null,
    coach_id int not null,
    founded_date date null,
    constraint fk_team_sport foreign key (sport_id) references sport(sport_id) on delete restrict on update cascade,
    constraint fk_team_coach foreign key (coach_id) references coach(coach_id) on delete restrict on update cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table app_user (
    user_id int auto_increment primary key,
    username varchar(50) not null unique,
    password_hash varchar(255) not null,
    role enum('Admin','Coach','FrontDesk') not null,
    coach_id int null,
    is_active boolean not null default true,
    last_login datetime null,
    constraint fk_app_user_coach foreign key (coach_id) references coach(coach_id) on delete set null on update cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table payment (
    payment_id int auto_increment primary key,
    membership_id int not null,
    amount decimal(10,2) not null,
    payment_date datetime not null,
    method enum('Cash','Card','Bank Transfer','Mobile Money') not null,
    status enum('Pending','Completed','Failed','Refunded') not null default 'Pending',
    reference_no varchar(50) null unique,
    constraint fk_payment_membership foreign key (membership_id) references membership(membership_id) on delete restrict on update cascade,
    constraint chk_payment_amount_positive check (amount > 0)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table facility_booking (
    booking_id int auto_increment primary key,
    facility_id int not null,
    team_id int not null,
    booking_date date not null,
    time_slot enum('06:00-08:00','08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00','16:00-18:00','18:00-20:00','20:00-22:00') not null,
    purpose varchar(100) null,
    status enum('Confirmed','Cancelled') not null default 'Confirmed',
    created_at timestamp not null default current_timestamp,
    constraint fk_booking_facility foreign key (facility_id) references facility(facility_id) on delete restrict on update cascade,
    constraint fk_booking_team foreign key (team_id) references team(team_id) on delete restrict on update cascade,
    constraint uq_facility_slot unique (facility_id, booking_date, time_slot)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table team_roster (
    team_id int not null,
    athlete_id int not null,
    date_joined date not null default current_date,
    position varchar(50) null,
    is_active boolean not null default true,
    primary key (team_id, athlete_id),
    constraint fk_roster_team foreign key (team_id) references team(team_id) on delete cascade on update cascade,
    constraint fk_roster_athlete foreign key (athlete_id) references athlete(athlete_id) on delete cascade on update cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table team_competition (
    team_id int not null,
    competition_id int not null,
    registration_date date not null default current_date,
    final_position int null,
    points_scored int null,
    primary key (team_id, competition_id),
    constraint fk_teamcomp_team foreign key (team_id) references team(team_id) on delete cascade on update cascade,
    constraint fk_teamcomp_competition foreign key (competition_id) references competition(competition_id) on delete cascade on update cascade,
    constraint chk_teamcomp_position_positive check (final_position > 0),
    constraint chk_teamcomp_points_nonneg check (points_scored >= 0)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;
