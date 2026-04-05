alter table profiles add column if not exists scheduled_assessment_date date;
comment on column profiles.scheduled_assessment_date is '預約評量日期';
