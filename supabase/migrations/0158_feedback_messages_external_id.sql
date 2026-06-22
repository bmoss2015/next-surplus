alter table public.feedback_messages
add column if not exists external_message_id text;

create unique index if not exists feedback_messages_external_id_uniq
on public.feedback_messages (external_message_id)
where external_message_id is not null;
