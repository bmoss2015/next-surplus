-- Curate the seeded lost_reasons list per user feedback. Keeps DNC Requested
-- (which the user prefers over "Asked to be Removed") and the two
-- user-requested additions. Removes the rest of the originally seeded list.
--
-- Existing leads with stage = 'lost' keep their lost_reason text intact —
-- lost_reason is plain text on leads, not a foreign key.

delete from lost_reasons
where label in (
  'Owner Uncooperative',
  'Asked to be Removed',
  'Already Claimed by Heir',
  'Contested by Another Firm',
  'Active Bankruptcy Stay',
  'Title Issue',
  'Below Floor After Research'
);
