-- Rename the misleading contacts.notes column to recipient_label.
--
-- Background: contacts.notes has always been used for a single purpose —
-- storing the recipient label for mailing_address rows (e.g.
-- "John Doe (Owner)"). Phone and email contact rows write null to it.
-- The name "notes" suggested free-form notes, which confused both users
-- and code reading from it (the Send Mail merge field {{contact.first_name}}
-- secretly pulled from contacts.notes).
--
-- Rename is in-place — no data movement, no risk of partial state.
-- Application code is updated in the same release to read/write the new
-- column name.

alter table contacts rename column notes to recipient_label;
