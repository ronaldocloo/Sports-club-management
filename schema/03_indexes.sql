create index idx_athlete_lastname on athlete (last_name);
create index idx_membership_status on membership (status);
create index idx_membership_dates on membership (start_date, end_date);
create index idx_payment_date on payment (payment_date);
create index idx_payment_status on payment (status);
create index idx_competition_date on competition (comp_date);
