-- Add R1 (右手拇指/管理力) and L2 (左手食指/心像力) fields to profiles
alter table profiles add column if not exists r1_pattern text;
alter table profiles add column if not exists l2_pattern text;

comment on column profiles.r1_pattern is '右手拇指(R1)紋型 - 管理力';
comment on column profiles.l2_pattern is '左手食指(L2)紋型 - 心像力';
