-- Adds microdeposit_type to mail_bank_accounts. Lob picks the
-- verification mode per receiving bank: "amounts" for traditional
-- banks (two random small deposits, user enters both), "descriptor_code"
-- for fintech banks like Mercury / Brex / Novo (one $0.01 deposit + a
-- 6-character code in the ACH descriptor). The Verify Manually modal
-- reads this column to branch its UI so each customer sees the right
-- input regardless of bank type. Null when we never queried Lob (older
-- rows, pre-this-migration).

alter table mail_bank_accounts
  add column if not exists microdeposit_type text;

comment on column mail_bank_accounts.microdeposit_type is
  'Lob micro-deposit verification mode for this bank account. Possible values: amounts, descriptor_code. Drives the Verify Manually modal UI.';
