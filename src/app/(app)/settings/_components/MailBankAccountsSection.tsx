"use client";

// Settings · Bank Accounts.
//
// Add Bank Account opens BankAccountDrawer where the operator types
// the routing + account numbers. Lob /bank_accounts creates the row;
// two small test deposits arrive in 1-2 business days. The Verify
// Manually modal on each unverified card collects the two cent amounts
// and flips the row to verified.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MailBankAccountRow } from "@/lib/settings/fetch";
import {
  deleteMailBankAccount,
  verifyMailBankAccountManually,
} from "@/app/(app)/settings/_actions";
import { BankAccountDrawer, type BankDrawerState } from "./BankAccountDrawer";
import { Modal } from "@/components/Modal";

const LOB_VERIFY_ATTEMPT_LIMIT = 3;

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

function relativeTime(iso: string | null): string {
  if (!iso) return "not checked yet";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function MailBankAccountsSection({
  initial,
}: {
  initial: MailBankAccountRow[];
}) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<BankDrawerState>({ kind: "closed" });
  const [confirmRow, setConfirmRow] = useState<MailBankAccountRow | null>(null);
  const [verifyRow, setVerifyRow] = useState<MailBankAccountRow | null>(null);
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
            Bank accounts used to fund outgoing checks and certified mail.
            ACH only, credit and debit cards aren&apos;t eligible since the
            network won&apos;t draw checks against a credit line. Your
            monthly Next Surplus subscription is billed separately in{" "}
            <a href="#billing">Billing</a>.
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
              onVerify={() => setVerifyRow(b)}
            />
          ))}
        </div>
      )}

      <BankAccountDrawer
        state={drawer}
        onClose={() => setDrawer({ kind: "closed" })}
      />

      <ManualVerifyModal
        bank={verifyRow}
        onClose={() => setVerifyRow(null)}
        onVerified={() => {
          setVerifyRow(null);
          router.refresh();
        }}
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
  onVerify,
}: {
  bank: MailBankAccountRow;
  isFirst: boolean;
  onRemove: () => void;
  onVerify: () => void;
}) {
  const isVerified = bank.status === "verified";
  const attemptsUsed = bank.verify_attempts ?? 0;
  const attemptsRemaining = Math.max(0, LOB_VERIFY_ATTEMPT_LIMIT - attemptsUsed);
  const locked = attemptsRemaining === 0;

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
            title="Two small test deposits (under $1 each) are on the way to this bank. We auto-verify within 4 hours of both posting. If only one shows up after 3 business days, click Verify Manually."
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
        <span className="v">
          {formatDate(isVerified ? bank.verified_at : bank.created_at)}
        </span>
      </div>
      {!isVerified && (
        <>
          <div className="bank-card-row">
            <span className="l">Last Check</span>
            <span className="v" style={{ fontSize: 11 }}>
              {relativeTime(bank.last_verify_attempt_at)}
            </span>
          </div>
          {attemptsUsed > 0 && (
            <div className="bank-card-row">
              <span className="l">Attempts</span>
              <span className="v" style={{ fontSize: 11 }}>
                {attemptsUsed} of {LOB_VERIFY_ATTEMPT_LIMIT} used
              </span>
            </div>
          )}
          {bank.last_verify_error && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 10px",
                background: "rgba(220, 38, 38, 0.06)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                borderRadius: 6,
                fontSize: 11.5,
                color: "var(--danger)",
                lineHeight: 1.4,
              }}
            >
              {bank.last_verify_error}
            </div>
          )}
        </>
      )}
      <div className="bank-card-foot">
        <span className="text-[11px] text-3">
          {isVerified && isFirst ? "Default for outgoing checks" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {!isVerified && !locked && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: 11.5, padding: "4px 10px" }}
              onClick={onVerify}
            >
              Verify Manually
            </button>
          )}
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
    </div>
  );
}

function ManualVerifyModal({
  bank,
  onClose,
  onVerified,
}: {
  bank: MailBankAccountRow | null;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [submitting, startSubmit] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function parseCents(input: string): number | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const dollarMatch = /^\$?0?\.(\d{1,2})$/.exec(trimmed);
    if (dollarMatch) {
      const digits = dollarMatch[1].padEnd(2, "0").slice(0, 2);
      return Number.parseInt(digits, 10);
    }
    const centMatch = /^(\d{1,2})$/.exec(trimmed);
    if (centMatch) return Number.parseInt(centMatch[1], 10);
    return null;
  }

  function reset() {
    setAmount1("");
    setAmount2("");
    setErr(null);
  }

  function submit() {
    if (!bank) return;
    const a1 = parseCents(amount1);
    const a2 = parseCents(amount2);
    if (a1 === null || a2 === null) {
      setErr("Enter both amounts in cents (e.g. 7) or dollars (e.g. 0.07)");
      return;
    }
    if (a1 < 1 || a1 > 99 || a2 < 1 || a2 > 99) {
      setErr("Each amount must be between 1 and 99 cents");
      return;
    }
    setErr(null);
    startSubmit(async () => {
      const res = await verifyMailBankAccountManually({
        bank_account_id: bank.id,
        amount1_cents: a1,
        amount2_cents: a2,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      reset();
      onVerified();
    });
  }

  if (!bank) return null;
  const attemptsUsed = bank.verify_attempts ?? 0;
  const attemptsRemaining = LOB_VERIFY_ATTEMPT_LIMIT - attemptsUsed;

  return (
    <Modal
      open={true}
      onClose={() => {
        if (!submitting) {
          reset();
          onClose();
        }
      }}
      title="Verify Bank Account"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p
          className="m-0"
          style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}
        >
          Enter the two small test deposit amounts you see on your bank
          statement for <strong>{bank.bank_name ?? "this account"}</strong>{" "}
          {maskLast4(bank.account_last_four)}. Each will be between 1 and 99
          cents.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label
              className="drawer-label"
              style={{ fontSize: 11.5, marginBottom: 4 }}
            >
              Amount 1
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0.07"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              className="input"
              style={{ width: "100%" }}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              className="drawer-label"
              style={{ fontSize: 11.5, marginBottom: 4 }}
            >
              Amount 2
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.23"
              value={amount2}
              onChange={(e) => setAmount2(e.target.value)}
              className="input"
              style={{ width: "100%" }}
              disabled={submitting}
            />
          </div>
        </div>

        <p
          className="m-0"
          style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}
        >
          You have <strong>{attemptsRemaining}</strong> of{" "}
          {LOB_VERIFY_ATTEMPT_LIMIT} verification attempts remaining. After 3
          failed attempts the account is locked and you&apos;ll need to remove
          it and re-add.
        </p>

        {err && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(220, 38, 38, 0.06)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--danger)",
              lineHeight: 1.4,
            }}
          >
            {err}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={submitting}
            style={{ minWidth: 100 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={submit}
            disabled={submitting || !amount1.trim() || !amount2.trim()}
            style={{ minWidth: 100 }}
          >
            {submitting ? "Verifying…" : "Verify"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
