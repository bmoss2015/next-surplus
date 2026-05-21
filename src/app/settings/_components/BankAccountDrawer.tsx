"use client";

// Settings clone · Phase D.3 — Bank account add + verify-deposits drawer.
//
// Two modes on a single drawer:
//   mode="add"    — collect routing/account/holder/type, call
//                   createMailBankAccount. Lob initiates two
//                   micro-deposits offline.
//   mode="verify" — collect the two cent amounts that landed on the
//                   user's statement, call verifyMailBankAccount.
//
// Add validates client-side: routing must be 9 digits, account must be at
// least 4 digits, holder non-empty. Verify accepts cents as 1-99 each.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import {
  createMailBankAccount,
  verifyMailBankAccount,
} from "@/app/(app)/settings/_actions";
import type { MailBankAccountRow } from "@/lib/settings/fetch";

export type BankDrawerState =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "verify"; row: MailBankAccountRow };

export function BankAccountDrawer({
  state,
  onClose,
}: {
  state: BankDrawerState;
  onClose: () => void;
}) {
  return state.kind === "add" ? (
    <AddDrawer open onClose={onClose} />
  ) : state.kind === "verify" ? (
    <VerifyDrawer open onClose={onClose} row={state.row} />
  ) : (
    <AddDrawer open={false} onClose={onClose} />
  );
}

function AddDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [routing, setRouting] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [holder, setHolder] = useState("");
  const [accountType, setAccountType] = useState<"company" | "individual">(
    "company"
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setRouting("");
      setAccountNum("");
      setHolder("");
      setAccountType("company");
      setErrMsg(null);
    }
  }, [open]);

  const routingClean = routing.replace(/\D/g, "");
  const accountClean = accountNum.replace(/\D/g, "");
  const ready =
    routingClean.length === 9 &&
    accountClean.length >= 4 &&
    holder.trim().length > 0;

  function onAdd() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await createMailBankAccount({
        routing_number: routingClean,
        account_number: accountClean,
        account_holder_name: holder.trim(),
        account_type: accountType,
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Add Account"
      title="Add Bank Account"
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!ready || pending}
            onClick={onAdd}
          >
            {pending ? "Submitting…" : "Submit For Verification"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          {errMsg && (
            <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {errMsg}
            </span>
          )}
        </div>
      }
    >
      <div className="drawer-field">
        <div className="drawer-hint">
          Numbers are forwarded to Lob and stored there. The portal only
          keeps the last four digits for display. Lob will deposit two
          small amounts (under $1 each) in 1-2 business days — enter them
          here from this drawer to verify.
        </div>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Account Holder Name</label>
        <input
          className="input"
          style={{ width: "100%" }}
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Moss Equity Partners LLC"
          autoFocus
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Account Type</label>
        <div className="role-choice">
          <label
            className={
              "role-choice-card" +
              (accountType === "company" ? " selected" : "")
            }
            onClick={() => setAccountType("company")}
          >
            <input
              type="radio"
              name="account-type"
              checked={accountType === "company"}
              onChange={() => setAccountType("company")}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Company</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                Business checking, LLC, or corporate account.
              </div>
            </div>
          </label>
          <label
            className={
              "role-choice-card" +
              (accountType === "individual" ? " selected" : "")
            }
            onClick={() => setAccountType("individual")}
          >
            <input
              type="radio"
              name="account-type"
              checked={accountType === "individual"}
              onChange={() => setAccountType("individual")}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Individual</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                Personal checking in your name.
              </div>
            </div>
          </label>
        </div>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Routing Number</label>
        <input
          className="input tabular"
          style={{ width: "100%" }}
          value={routing}
          onChange={(e) => setRouting(e.target.value)}
          placeholder="9 digits"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Account Number</label>
        <input
          className="input tabular"
          style={{ width: "100%" }}
          value={accountNum}
          onChange={(e) => setAccountNum(e.target.value)}
          placeholder="Your full account number"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
    </Drawer>
  );
}

function VerifyDrawer({
  open,
  onClose,
  row,
}: {
  open: boolean;
  onClose: () => void;
  row: MailBankAccountRow;
}) {
  const router = useRouter();
  const [amt1, setAmt1] = useState("");
  const [amt2, setAmt2] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setAmt1("");
      setAmt2("");
      setErrMsg(null);
    }
  }, [open]);

  // Expect cents 1-99 each.
  const c1 = parseInt(amt1.replace(/\D/g, ""), 10);
  const c2 = parseInt(amt2.replace(/\D/g, ""), 10);
  const ready =
    Number.isInteger(c1) && c1 >= 1 && c1 <= 99 &&
    Number.isInteger(c2) && c2 >= 1 && c2 <= 99;

  function onVerify() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await verifyMailBankAccount({
        id: row.id,
        amount_1_cents: c1,
        amount_2_cents: c2,
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Verify Account"
      title={row.bank_name ?? row.account_holder_name}
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!ready || pending}
            onClick={onVerify}
          >
            {pending ? "Verifying…" : "Verify Account"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          {errMsg && (
            <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {errMsg}
            </span>
          )}
        </div>
      }
    >
      <div className="drawer-field">
        <div className="drawer-hint">
          Lob deposited two small amounts (under $1 each) in this account.
          Enter both, in cents, to confirm ownership.
        </div>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Deposit 1</label>
        <div className="field" style={{ width: 180 }}>
          <span className="prefix">¢</span>
          <input
            className="input tabular has-prefix text-right"
            value={amt1}
            onChange={(e) => setAmt1(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            autoFocus
          />
        </div>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Deposit 2</label>
        <div className="field" style={{ width: 180 }}>
          <span className="prefix">¢</span>
          <input
            className="input tabular has-prefix text-right"
            value={amt2}
            onChange={(e) => setAmt2(e.target.value)}
            placeholder="0"
            inputMode="numeric"
          />
        </div>
      </div>
    </Drawer>
  );
}
