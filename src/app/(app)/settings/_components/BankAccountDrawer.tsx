"use client";

// Bank account add drawer. Two entry modes:
//   1. Connect Bank — Plaid Link signs you in to your bank and pulls
//      the routing + account numbers. Skipped if Plaid env isn't
//      configured.
//   2. Enter Manually — type routing + account directly. Used as the
//      Plaid-down fallback and for users who prefer typing.
//
// Both paths submit to Lob /bank_accounts and start the standard
// micro-deposit verification cycle. The Verify Manually modal on the
// bank account card lets the operator enter the two cent amounts from
// their bank statement once the deposits arrive.

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { Drawer } from "./Drawer";
import {
  createPlaidLinkToken,
  exchangePlaidPublicTokenForBankAccount,
  addMailBankAccountManually,
} from "@/app/(app)/settings/_actions";

export type BankDrawerState =
  | { kind: "closed" }
  | { kind: "add" };

export function BankAccountDrawer({
  state,
  onClose,
}: {
  state: BankDrawerState;
  onClose: () => void;
}) {
  return <AddDrawer open={state.kind === "add"} onClose={onClose} />;
}

type Mode = "connect" | "manual";

function AddDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("connect");
  const [holder, setHolder] = useState("");
  const [accountType, setAccountType] = useState<"company" | "individual">(
    "company"
  );
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [exchanging, setExchanging] = useState(false);
  const [submittingManual, startManualSubmit] = useTransition();

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMode("connect");
      setHolder("");
      setAccountType("company");
      setRouting("");
      setAccount("");
      setBankName("");
      setLinkToken(null);
      setErrMsg(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const readyToLink = holder.trim().length > 0;
  const readyManual =
    holder.trim().length > 0 &&
    routing.replace(/\D/g, "").length === 9 &&
    account.replace(/\D/g, "").length >= 4;

  const onPlaidSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const selected = metadata.accounts[0];
      if (!selected) {
        setErrMsg("No account was selected.");
        return;
      }
      setExchanging(true);
      void (async () => {
        const res = await exchangePlaidPublicTokenForBankAccount({
          public_token: publicToken,
          account_id: selected.id,
          account_holder_name: holder.trim(),
          account_type: accountType,
          institution_name: metadata.institution?.name ?? null,
        });
        setExchanging(false);
        if (!res.ok) {
          setErrMsg(res.error);
          return;
        }
        router.refresh();
        onClose();
      })();
    },
    [holder, accountType, router, onClose]
  );

  const plaid = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) setErrMsg(err.display_message ?? err.error_message ?? null);
    },
  });

  function fetchLinkTokenThenOpen() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await createPlaidLinkToken();
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setLinkToken(res.link_token);
    });
  }

  useEffect(() => {
    if (linkToken && plaid.ready) {
      plaid.open();
    }
  }, [linkToken, plaid]);

  function submitManual() {
    setErrMsg(null);
    startManualSubmit(async () => {
      const res = await addMailBankAccountManually({
        routing_number: routing.replace(/\D/g, ""),
        account_number: account.replace(/\D/g, ""),
        account_holder_name: holder.trim(),
        account_type: accountType,
        bank_name: bankName.trim() || null,
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const submitting = pending || exchanging || submittingManual;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Add Account"
      title="Add Bank Account"
      footer={
        <div className="flex items-center gap-2">
          {mode === "connect" ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!readyToLink || submitting}
              onClick={fetchLinkTokenThenOpen}
            >
              {exchanging
                ? "Submitting…"
                : pending
                  ? "Opening…"
                  : "Connect Bank"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!readyManual || submitting}
              onClick={submitManual}
            >
              {submittingManual ? "Adding…" : "Add Bank Account"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={submitting}
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
          {mode === "connect"
            ? "Sign in to your bank. Two small test deposits (under $1 each) will arrive in 1-2 business days. We auto-verify as soon as both post."
            : "Type your routing and account numbers from a check. Two small test deposits (under $1 each) will arrive in 1-2 business days; enter both amounts on the bank card to verify."}
        </div>
      </div>

      <div className="drawer-field">
        <label className="drawer-label">Account Holder Name</label>
        <input
          className="input"
          style={{ width: "100%" }}
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Legal entity name on the account"
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

      {mode === "manual" && (
        <>
          <div className="drawer-field">
            <label className="drawer-label">Bank Name (Optional)</label>
            <input
              className="input"
              style={{ width: "100%" }}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Chase, Bank of America, etc."
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Routing Number</label>
            <input
              className="input"
              style={{ width: "100%" }}
              inputMode="numeric"
              maxLength={9}
              value={routing}
              onChange={(e) =>
                setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))
              }
              placeholder="9 digits"
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Account Number</label>
            <input
              className="input"
              style={{ width: "100%" }}
              inputMode="numeric"
              maxLength={17}
              value={account}
              onChange={(e) =>
                setAccount(e.target.value.replace(/\D/g, "").slice(0, 17))
              }
              placeholder="4 to 17 digits"
            />
          </div>
        </>
      )}

      <div className="drawer-field" style={{ marginTop: 4 }}>
        <button
          type="button"
          onClick={() => {
            setErrMsg(null);
            setMode(mode === "connect" ? "manual" : "connect");
          }}
          className="cursor-pointer"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 12,
            color: "var(--brand)",
            textDecoration: "underline",
          }}
          disabled={submitting}
        >
          {mode === "connect"
            ? "Or enter routing + account manually"
            : "Or sign in to your bank instead"}
        </button>
      </div>
    </Drawer>
  );
}
