create table if not exists public.feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    org_id uuid references public.orgs(id) on delete set null,
    type text not null check (type in ('bug', 'idea', 'question')),
    title text not null,
    body text not null,
    page_url text,
    surface text,
    status text not null default 'new' check (status in ('new', 'triaged', 'planned', 'shipped', 'wont_do')),
    response_body text,
    responded_at timestamptz,
    responded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists feedback_status_idx on public.feedback (status);
create index if not exists feedback_org_id_idx on public.feedback (org_id);
create index if not exists feedback_user_id_idx on public.feedback (user_id);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy feedback_select_own on public.feedback for select
using (user_id = auth.uid());

create policy feedback_insert_own on public.feedback for insert
with check (user_id = auth.uid());

create policy feedback_select_platform_admin on public.feedback for select
using (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and coalesce(p.can_view_feedback, false) = true
    )
);

create policy feedback_update_platform_admin on public.feedback for update
using (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and coalesce(p.can_view_feedback, false) = true
    )
)
with check (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and coalesce(p.can_view_feedback, false) = true
    )
);

alter table public.profiles
add column if not exists can_view_feedback boolean not null default false;

create index if not exists profiles_can_view_feedback_idx on public.profiles (can_view_feedback) where can_view_feedback = true;

create or replace function public.feedback_set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists feedback_updated_at on public.feedback;
create trigger feedback_updated_at
before update on public.feedback
for each row execute function public.feedback_set_updated_at();
