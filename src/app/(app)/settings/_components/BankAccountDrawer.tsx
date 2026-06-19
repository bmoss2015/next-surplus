"use client";

// Bank account add drawer — Plaid Link flow.
//
// The user picks "Add Bank Account", the drawer collects the account
// holder + company-vs-individual classification, then launches Plaid
// Link. Plaid handles bank login + account selection inline; on
// success we POST the public_token to the server, which mints a Lob
// processor_token and creates a Lob bank account already in
// 'verified' state. No micro-deposit wait.

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { Drawer } from "./Drawer";
import {
  createPlaidLinkToken,
  exchangePlaidPublicTokenForBankAccount,
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

function AddDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [holder, setHolder] = useState("");
  const [accountType, setAccountType] = useState<"company" | "individual">(
    "company"
  );
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setHolder("");
      setAccountType("company");
      setLinkToken(null);
      setErrMsg(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const readyToLink = holder.trim().length > 0;

  const onPlaidSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const account = metadata.accounts[0];
      if (!account) {
        setErrMsg("Plaid returned no selected account.");
        return;
      }
      setExchanging(true);
      void (async () => {
        const res = await exchangePlaidPublicTokenForBankAccount({
          public_token: publicToken,
          account_id: account.id,
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

  // Plaid Link is async — once the token is set and the SDK is ready
  // we open the modal automatically. Keeps the user from having to
  // click a second button.
  useEffect(() => {
    if (linkToken && plaid.ready) {
      plaid.open();
    }
  }, [linkToken, plaid]);

  const submitting = pending || exchanging;

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
            disabled={!readyToLink || submitting}
            onClick={fetchLinkTokenThenOpen}
          >
            {exchanging
              ? "Submitting To Lob…"
              : pending
                ? "Opening Plaid…"
                : "Connect Bank With Plaid"}
          </button>
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
          Sign in to your bank through Plaid. We pull the routing and
          account numbers from Plaid (you never type them) and send them
          to LOB. LOB will deposit two small test amounts (under $1 each)
          into your account over the next 1-2 business days. We poll your
          transactions every 4 hours and auto-verify as soon as both
          deposits post. If only one shows up after 3 business days, you
          can enter both amounts from your bank statement manually on the
          bank account card. Plaid never shares your password with us;
          we store only the last four digits of the routing and account
          numbers.
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
    </Drawer>
  );
}
