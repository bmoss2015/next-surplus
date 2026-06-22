alter table public.feedback
add column if not exists inbound_unread boolean not null default false;

create index if not exists feedback_inbound_unread_idx
on public.feedback (inbound_unread) where inbound_unread = true;

alter table public.feedback_messages
add column if not exists message_id text;

create index if not exists feedback_messages_message_id_idx
on public.feedback_messages (message_id) where message_id is not null;
