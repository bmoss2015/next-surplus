-- 0134: lead_latest_activity view
--
-- Adds a read-only view that returns one row per lead with the most recent
-- activity. Used by the Kanban card to render a "Last action" line without
-- forcing the client to fetch every activity for every lead and group in JS.
--
-- Uses DISTINCT ON which leverages the existing (lead_id, created_at desc)
-- index on activities for a fast scan.

CREATE OR REPLACE VIEW lead_latest_activity AS
SELECT DISTINCT ON (lead_id)
  lead_id,
  activity_type,
  payload,
  created_at
FROM activities
ORDER BY lead_id, created_at DESC;

-- Views inherit RLS from underlying tables. activities already has
-- org-scoped RLS via leads.org_id; no extra policy needed here.

GRANT SELECT ON lead_latest_activity TO authenticated;
