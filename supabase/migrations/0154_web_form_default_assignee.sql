-- Web form rows seeded by 0152 have assigned_to = null until an admin picks
-- someone in the Automations panel. That meant first submissions arrived
-- with no task and no email if the panel was never opened.
--
-- Fix: every existing web_form row with no assignee gets pinned to the
-- org's owner profile (the SaaS-operator seat). If the org has no owner,
-- falls back to any admin in that org. Idempotent and safe to re-run.

update public.web_forms wf
   set assigned_to = (
     select p.id
       from public.profiles p
      where p.org_id = wf.org_id
        and p.role = 'owner'
      order by p.created_at asc
      limit 1
   )
 where wf.assigned_to is null
   and exists (
     select 1 from public.profiles p
      where p.org_id = wf.org_id and p.role = 'owner'
   );

update public.web_forms wf
   set assigned_to = (
     select p.id
       from public.profiles p
      where p.org_id = wf.org_id
        and p.role = 'admin'
      order by p.created_at asc
      limit 1
   )
 where wf.assigned_to is null
   and exists (
     select 1 from public.profiles p
      where p.org_id = wf.org_id and p.role = 'admin'
   );
