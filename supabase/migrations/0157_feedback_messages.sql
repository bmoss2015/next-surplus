create table if not exists public.feedback_messages (
    id uuid primary key default gen_random_uuid(),
    feedback_id uuid not null references public.feedback(id) on delete cascade,
    direction text not null check (direction in ('outbound', 'inbound')),
    sender_user_id uuid references public.profiles(id) on delete set null,
    sender_name text,
    sender_email text,
    body text not null,
    created_at timestamptz not null default now()
);

create index if not exists feedback_messages_feedback_id_idx
    on public.feedback_messages (feedback_id, created_at);

alter table public.feedback_messages enable row level security;

drop policy if exists feedback_messages_select_platform_admin on public.feedback_messages;
create policy feedback_messages_select_platform_admin on public.feedback_messages for select
using (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and coalesce(p.can_view_feedback, false) = true
    )
);

drop policy if exists feedback_messages_insert_platform_admin on public.feedback_messages;
create policy feedback_messages_insert_platform_admin on public.feedback_messages for insert
with check (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and coalesce(p.can_view_feedback, false) = true
    )
);
