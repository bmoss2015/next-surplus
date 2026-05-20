"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash, IconCheck } from "@tabler/icons-react";
import {
  createMailBankAccount,
  verifyMailBankAccount,
  deleteMailBankAccount,
} from "../_actions";
import type { MailBankAccountRow } from "@/lib/settings/fetch";

export function MailBankAccountsSection({
  initial,
}: {
  initial: MailBankAccountRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function remove(id: string) {
    if (
      !confirm(
        "Remove this bank account? Sent checks already drawn on it stay on record."
      )
    )
      return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteMailBankAccount(id);
    });
  }

  return (
    <div className="col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-subheader mb-0">Bank Accounts</h2>
          <div className="mt-1 text-[12.5px] text-gray-500">
            Verified accounts available to draw outgoing checks from. Routing and account numbers are stored only by Lob.
          </div>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Bank Account
          </button>
        )}
      </div>

      {adding && (
        <AddBankAccountForm
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      {rows.length === 0 && !adding ? (
        <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No bank accounts yet. Add one to enable check sending.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4">
          {rows.map((row) => {
            const masked = row.account_last_four ? `**** ${row.account_last_four}` : "****";
            const routing = row.routing_last_four ? `**** ${row.routing_last_four}` : "—";
            return (
              <div key={row.id} className="bank-card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-ink" style={{ letterSpacing: "-0.014em" }}>
                      {row.bank_name || row.account_holder_name}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5 truncate">{row.account_holder_name}</div>
                  </div>
                  {row.status === "verified" ? (
                    <span className="role-tab role-tab-pending" style={{ background: "#0d4b3a", color: "#fff", border: 0, padding: "5px 10px" }}>
                      VERIFIED
                    </span>
                  ) : (
                    <span className="role-tab role-tab-pending">PENDING</span>
                  )}
                </div>
                <div className="flex justify-between py-1 text-[12px] tabular-nums"><span className="text-gray-400">Account</span><span className="text-ink">{masked}</span></div>
                <div className="flex justify-between py-1 text-[12px] tabular-nums"><span className="text-gray-400">Routing</span><span className="text-ink">{routing}</span></div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-150">
                  {row.status === "verified" ? (
                    <span className="text-[11px] text-gray-400">Ready for outgoing checks</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVerifyingId(row.id)}
                      className="rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-[11.5px] font-medium text-ink hover:border-gray-300"
                    >
                      Enter Test Deposits
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="cursor-pointer text-gray-400 hover:text-danger"
                    aria-label="Remove"
                  >
                    <IconTrash size={14} stroke={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {verifyingId && (
        <VerifyForm
          id={verifyingId}
          onCancel={() => setVerifyingId(null)}
          onSaved={() => {
            setVerifyingId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function AddBankAccountForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [type, setType] = useState<"company" | "individual">("company");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          type="text"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Account Holder Name"
          className={inputClass}
        />
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value === "individual" ? "individual" : "company")
          }
          className={`${inputClass} cursor-pointer`}
        >
          <option value="company">Company</option>
          <option value="individual">Individual</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={routing}
          onChange={(e) => setRouting(e.target.value.replace(/\D/g, ""))}
          placeholder="Routing Number (9 digits)"
          className={inputClass}
          maxLength={9}
        />
        <input
          type="text"
          inputMode="numeric"
          value={account}
          onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))}
          placeholder="Account Number"
          className={inputClass}
        />
      </div>
      {err && <div className="text-[12px] text-danger">{err}</div>}
      <div className="text-[11px] text-gray-500">
        Lob will send two small test deposits to verify ownership within 1-3
        business days.
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setErr(null);
            startTransition(async () => {
              const res = await createMailBankAccount({
                routing_number: routing,
                account_number: account,
                account_holder_name: holder,
                account_type: type,
              });
              if (res.ok) onSaved();
              else setErr(res.error);
            });
          }}
          disabled={pending || !routing || !account || !holder}
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving" : "Add Account"}
        </button>
      </div>
    </div>
  );
}

function VerifyForm({
  id,
  onCancel,
  onSaved,
}: {
  id: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="text-[12px] font-medium text-ink">
        Enter the two test deposit amounts
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          type="number"
          step="0.01"
          value={a1}
          onChange={(e) => setA1(e.target.value)}
          placeholder="0.05"
          className={inputClass}
        />
        <input
          type="number"
          step="0.01"
          value={a2}
          onChange={(e) => setA2(e.target.value)}
          placeholder="0.13"
          className={inputClass}
        />
      </div>
      {err && <div className="text-[12px] text-danger">{err}</div>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setErr(null);
            const c1 = Math.round(parseFloat(a1) * 100);
            const c2 = Math.round(parseFloat(a2) * 100);
            if (!Number.isFinite(c1) || !Number.isFinite(c2)) {
              setErr("Enter both amounts");
              return;
            }
            startTransition(async () => {
              const res = await verifyMailBankAccount({
                id,
                amount_1_cents: c1,
                amount_2_cents: c2,
              });
              if (res.ok) onSaved();
              else setErr(res.error);
            });
          }}
          disabled={pending}
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Verifying" : "Verify"}
        </button>
      </div>
    </div>
  );
}
