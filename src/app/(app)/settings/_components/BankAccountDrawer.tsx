"use client";

// Bank account add drawer. Manual routing + account entry only.
// Submits to Lob /bank_accounts; the standard micro-deposit cycle
// runs after that, and the Verify Manually modal on the bank account
// card collects the two cent amounts to flip status to verified.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import { addMailBankAccountManually } from "@/app/(app)/settings/_actions";

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
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setHolder("");
      setAccountType("company");
      setRouting("");
      setAccount("");
      setBankName("");
      setErrMsg(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const ready =
    holder.trim().length > 0 &&
    routing.replace(/\D/g, "").length === 9 &&
    account.replace(/\D/g, "").length >= 4;

  function submit() {
    setErrMsg(null);
    startSubmit(async () => {
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
            disabled={!ready || submitting}
            onClick={submit}
          >
            {submitting ? "Adding…" : "Add Bank Account"}
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
          Enter your bank&apos;s routing and account numbers from a check.
          Two small test deposits (under $1 each) will arrive in 1-2
          business days. Enter both amounts on the bank card to verify.
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
    </Drawer>
  );
}
