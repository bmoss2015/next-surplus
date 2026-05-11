-- Restructure liens: drop the single junior_liens scalar, replace with a
-- proper liens table that keeps leads.total_liens in sync via triggers.

ALTER TABLE leads DROP COLUMN estimated_net_payout;
ALTER TABLE leads DROP COLUMN estimated_surplus;

ALTER TABLE leads RENAME COLUMN junior_liens TO total_liens;

ALTER TABLE leads ADD COLUMN estimated_surplus numeric(12,2)
  GENERATED ALWAYS AS (
    coalesce(closing_bid,0) - coalesce(outstanding_debt,0)
      - coalesce(court_costs,0) - coalesce(total_liens,0)
  ) STORED;

ALTER TABLE leads ADD COLUMN estimated_net_payout numeric(12,2)
  GENERATED ALWAYS AS (
    (coalesce(closing_bid,0) - coalesce(outstanding_debt,0)
      - coalesce(court_costs,0) - coalesce(total_liens,0))
      * (recovery_fee_percent/100) - attorney_cost
  ) STORED;

CREATE INDEX leads_estimated_surplus_idx ON leads(estimated_surplus desc);

create table liens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_id uuid not null references leads(id) on delete cascade,
  name text not null default '',
  amount numeric(12,2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index liens_lead_id_idx on liens(lead_id);
alter table liens enable row level security;
create policy "liens org all" on liens for all to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create trigger liens_updated_at before update on liens
  for each row execute function set_updated_at();

create or replace function sync_lead_total_liens() returns trigger
language plpgsql as $$
declare
  affected uuid;
begin
  affected := coalesce(NEW.lead_id, OLD.lead_id);
  update leads
    set total_liens = coalesce((select sum(amount) from liens l where l.lead_id = affected), 0)
    where id = affected;
  return null;
end;
$$;

create trigger liens_sync_total_ins after insert on liens
  for each row execute function sync_lead_total_liens();
create trigger liens_sync_total_upd after update on liens
  for each row execute function sync_lead_total_liens();
create trigger liens_sync_total_del after delete on liens
  for each row execute function sync_lead_total_liens();

insert into liens (org_id, lead_id, name, amount, position)
  select org_id, id, 'Liens', total_liens, 0 from leads where coalesce(total_liens,0) > 0;
