"use client";

// Settings clone · Phase E.5 — merge-field picker for the Template editor.
//
// Renders a compact button bar of clickable chips, each one inserting the
// matching {{token}} into the parent input/textarea at the current cursor
// position. Groups are collapsible so the picker doesn't dominate the
// editor on small drawers.
//
// Tokens kept short and consistent with the portal's existing merge-field
// vocabulary: contact.first_name, lead.address, signer_name, etc. Sending
// code is what actually substitutes — picker is just an input affordance.

import { useState } from "react";

type Field = { token: string; label: string };
type Group = { name: string; fields: Field[] };

const GROUPS: Group[] = [
  {
    name: "Contact",
    fields: [
      { token: "{{contact.first_name}}", label: "First Name" },
      { token: "{{contact.last_name}}", label: "Last Name" },
      { token: "{{contact.full_name}}", label: "Full Name" },
      { token: "{{contact.email}}", label: "Email" },
      { token: "{{contact.phone}}", label: "Phone" },
    ],
  },
  {
    name: "Lead",
    fields: [
      { token: "{{lead.address}}", label: "Address" },
      { token: "{{lead.city}}", label: "City" },
      { token: "{{lead.state}}", label: "State" },
      { token: "{{lead.zip}}", label: "ZIP" },
      { token: "{{lead.county}}", label: "County" },
      { token: "{{lead.case_number}}", label: "Case Number" },
      { token: "{{lead.estimated_surplus}}", label: "Estimated Surplus" },
      { token: "{{lead.recovery_fee_amount}}", label: "Recovery Fee" },
      { token: "{{lead.estimated_net}}", label: "Estimated Net" },
    ],
  },
  {
    name: "Signer",
    fields: [
      { token: "{{signer_name}}", label: "Signer Name" },
      { token: "{{signer_title}}", label: "Signer Title" },
      { token: "{{signature}}", label: "Signature Image" },
      { token: "{{company.name}}", label: "Company Name" },
      { token: "{{company.phone}}", label: "Company Phone" },
      { token: "{{company.email}}", label: "Company Email" },
    ],
  },
];

export function MergeFieldPicker({
  onInsert,
  compact = false,
}: {
  onInsert: (token: string) => void;
  compact?: boolean;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(
    compact ? null : "Contact"
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        margin: compact ? "6px 0" : "8px 0 10px",
        padding: compact ? "6px 8px" : "10px 12px",
        background: "var(--brand-tint, #f3f9f6)",
        border: "1px solid var(--hairline)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {GROUPS.map((g) => (
          <button
            key={g.name}
            type="button"
            onClick={() =>
              setOpenGroup((prev) => (prev === g.name ? null : g.name))
            }
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid transparent",
              background:
                openGroup === g.name ? "var(--brand)" : "var(--surface)",
              color: openGroup === g.name ? "#fff" : "var(--text-2)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: "pointer",
            }}
          >
            {g.name}
          </button>
        ))}
      </div>
      {openGroup && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {GROUPS.find((g) => g.name === openGroup)?.fields.map((f) => (
            <button
              key={f.token}
              type="button"
              onClick={() => onInsert(f.token)}
              title={f.token}
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid var(--hairline)",
                background: "var(--surface)",
                color: "var(--ink-2)",
                fontSize: 11.5,
                fontFamily:
                  "'JetBrains Mono', ui-monospace, monospace",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
