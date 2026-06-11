"use client";

// Settings · Bank Accounts — Plaid Link add + delete.
//
// Add Bank Account opens BankAccountDrawer which launches Plaid Link;
// the bank account lands already verified, so there's no separate
// verify step. Legacy rows added via the old Lob micro-deposit flow
// may still display as unverified — they're read-only and should be
// removed if their micro-deposits never landed.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MailBankAccountRow } from "@/lib/settings/fetch";
import { deleteMailBankAccount } from "@/app/(app)/settings/_actions";
import { BankAccountDrawer, type BankDrawerState } from "./BankAccountDrawer";
import { Modal } from "@/components/Modal";

function maskLast4(last4: string | null): string {
  if (!last4) return "•••• ••••";
  return `**** ${last4}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MailBankAccountsSection({
  initial,
}: {
  initial: MailBankAccountRow[];
}) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<BankDrawerState>({ kind: "closed" });
  const [confirmRow, setConfirmRow] = useState<MailBankAccountRow | null>(null);
  const [deleting, startDelete] = useTransition();

  function confirmDelete() {
    if (!confirmRow) return;
    const id = confirmRow.id;
    startDelete(async () => {
      await deleteMailBankAccount(id);
      setConfirmRow(null);
      router.refresh();
    });
  }

  return (
    <section id="panel-mail-bank" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Letters</a>
        <i className="icon icon-chevron-right" />
        <span>Bank Accounts</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Bank Accounts</h1>
          <p className="section-desc">
            Bank accounts used to fund outgoing checks and certified mail
            through Lob. ACH only, credit and debit cards aren&apos;t
            eligible since the network won&apos;t draw checks against a
            credit line. Your monthly Moss Equity subscription is billed
            separately in <a href="#billing">Billing</a>.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setDrawer({ kind: "add" })}
        >
          <i className="icon icon-plus" /> Add Bank Account
        </button>
      </div>

      {initial.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: "32px 24px",
            background: "var(--surface)",
            border: "1px dashed var(--hairline)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: 13,
          }}
        >
          No bank accounts yet. Click Add Bank Account to connect one.
        </div>
      ) : (
        <div className="bank-grid">
          {initial.map((b, idx) => (
            <BankCard
              key={b.id}
              bank={b}
              isFirst={idx === 0}
              onRemove={() => setConfirmRow(b)}
            />
          ))}
        </div>
      )}

      <BankAccountDrawer
        state={drawer}
        onClose={() => setDrawer({ kind: "closed" })}
      />

      <Modal
        open={confirmRow !== null}
        onClose={() => {
          if (!deleting) setConfirmRow(null);
        }}
        title="Remove Bank Account"
      >
        <p className="m-0 text-[13px] text-ink">
          Remove{" "}
          <strong>
            {confirmRow?.bank_name ?? "this account"}{" "}
            {maskLast4(confirmRow?.account_last_four ?? null)}
          </strong>
          ? It will no longer be available for funding checks or certified
          mail. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setConfirmRow(null)}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={confirmDelete}
            disabled={deleting}
            style={{
              background: "var(--danger)",
              color: "#fff",
              border: "1px solid var(--danger)",
            }}
          >
            {deleting ? "Removing…" : "Remove Bank Account"}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function BankCard({
  bank,
  isFirst,
  onRemove,
}: {
  bank: MailBankAccountRow;
  isFirst: boolean;
  onRemove: () => void;
}) {
  const isVerified = bank.status === "verified";

  return (
    <div className="bank-card">
      <div className="bank-card-head">
        <div>
          <div className="bank-card-bank">
            {bank.bank_name ?? "Bank Account"}
          </div>
          <div className="bank-card-holder">{bank.account_holder_name}</div>
        </div>
        {isVerified ? (
          <span
            className="role-tab"
            style={{
              display: "inline-flex",
              background: "var(--brand)",
              color: "#fff",
              minWidth: 0,
            }}
          >
            VERIFIED
          </span>
        ) : (
          <span
            className="role-tab"
            style={{
              display: "inline-flex",
              background: "transparent",
              color: "var(--brand)",
              border: "1px solid var(--brand)",
              minWidth: 0,
            }}
            title="Waiting for Lob's test deposits to land in your bank. We'll auto-verify via Plaid once they post (usually 1-2 business days). You don't need to do anything."
          >
            VERIFYING
          </span>
        )}
      </div>
      <div className="bank-card-row">
        <span className="l">Account</span>
        <span className="v">{maskLast4(bank.account_last_four)}</span>
      </div>
      <div className="bank-card-row">
        <span className="l">Routing</span>
        <span className="v">{maskLast4(bank.routing_last_four)}</span>
      </div>
      <div className="bank-card-row">
        <span className="l">{isVerified ? "Verified" : "Added"}</span>
        <span className="v">{formatDate(bank.verified_at)}</span>
      </div>
      <div className="bank-card-foot">
        <span className="text-[11px] text-3">
          {isVerified && isFirst ? "Default for outgoing checks" : ""}
        </span>
        <button
          type="button"
          className="icon-btn"
          title="Remove"
          onClick={onRemove}
        >
          <i className="icon icon-trash" />
        </button>
      </div>
    </div>
  );
}
