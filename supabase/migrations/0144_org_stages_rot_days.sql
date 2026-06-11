alter table org_stages
  add column rot_days int;

alter table org_stages
  add constraint org_stages_rot_days_positive check (rot_days is null or rot_days >= 1);
