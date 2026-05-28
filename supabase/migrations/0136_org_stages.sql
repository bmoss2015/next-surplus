create type stage_kind as enum ('open', 'won', 'lost');

create table org_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  name text not null,
  position int not null,
  kind stage_kind not null default 'open',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, position) deferrable initially deferred
);

create index org_stages_org_position_idx on org_stages(org_id, position);
create index org_stages_org_kind_idx on org_stages(org_id, kind);

alter table org_stages enable row level security;

create policy "org_stages org read" on org_stages for select to authenticated
  using (org_id = auth_org_id());
create policy "org_stages org write" on org_stages for all to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create trigger org_stages_updated_at before update on org_stages
  for each row execute function set_updated_at();

do $$
declare
  r record;
  seed jsonb := jsonb_build_array(
    jsonb_build_object('name', 'New Leads',       'kind', 'open'),
    jsonb_build_object('name', 'Qualifying',      'kind', 'open'),
    jsonb_build_object('name', 'Outreach',        'kind', 'open'),
    jsonb_build_object('name', 'In Conversation', 'kind', 'open'),
    jsonb_build_object('name', 'Contract',        'kind', 'open'),
    jsonb_build_object('name', 'With Attorney',   'kind', 'open'),
    jsonb_build_object('name', 'Claim Filed',     'kind', 'open'),
    jsonb_build_object('name', 'Won',             'kind', 'won'),
    jsonb_build_object('name', 'Lost',            'kind', 'lost')
  );
  s jsonb;
  pos int;
begin
  for r in select id from orgs loop
    pos := 0;
    for s in select * from jsonb_array_elements(seed) loop
      insert into org_stages (org_id, name, position, kind)
      values (r.id, s->>'name', pos, (s->>'kind')::stage_kind);
      pos := pos + 1;
    end loop;
  end loop;
end $$;

alter table leads add column stage_id uuid references org_stages(id);

update leads l
   set stage_id = s.id
  from org_stages s
 where s.org_id = l.org_id
   and lower(replace(s.name, ' ', '_')) = l.stage::text;

create index leads_stage_id_idx on leads(stage_id);
