-- Fix DD: the real "relation state_rules does not exist" culprit.
--
-- 0070 dropped the state_rules table, but the leads_compute_dates() trigger
-- function — fired BEFORE INSERT OR UPDATE OF sale_date, state ON leads — still
-- runs `select ... from state_rules`. PL/pgSQL function bodies aren't dependency
-- tracked, so `drop table ... cascade` left it in place and broken. Result:
-- every lead insert that sets sale_date + state (i.e. every imported lead, and
-- the manual New Lead form) fails — which is why imports were writing 0 rows.
--
-- The redemption-period / filing-window data lived only in state_rules and has
-- no replacement table, and recovery_type prefill now happens in the import
-- action via recovery_type_lookup (migration 0073). So just remove the trigger
-- and its function.

drop trigger if exists leads_compute_dates_trg on leads;
drop function if exists leads_compute_dates();
