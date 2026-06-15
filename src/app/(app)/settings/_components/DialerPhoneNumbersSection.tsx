"use client";

import { useState } from "react";

type Row = {
  id: string;
  number: string;
  state: string;
  status: "Active" | "Pending";
};

const SEED: Row[] = [
  { id: "n1", number: "(404) 555-0101", state: "GA", status: "Active" },
  { id: "n2", number: "(864) 555-0102", state: "SC", status: "Active" },
  { id: "n3", number: "(615) 555-0103", state: "TN", status: "Active" },
  { id: "n4", number: "(215) 555-0104", state: "PA", status: "Active" },
  { id: "n5", number: "(216) 555-0105", state: "OH", status: "Active" },
  { id: "n6", number: "(212) 555-0106", state: "NY", status: "Active" },
];

export function DialerPhoneNumbersSection() {
  const [rows] = useState<Row[]>(SEED);

  return (
    <section id="panel-dialer-numbers" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Dialer</a>
        <i className="icon icon-chevron-right" />
        <span>Phone Numbers</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Phone Numbers</h1>
          <p className="section-desc">
            Outbound caller IDs your team uses when dialing leads. Assign a
            number to each state so local numbers call local prospects.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled>
          <i className="icon icon-plus" /> Add Number
        </button>
      </div>

      <div className="list" style={{ marginTop: 32 }}>
        <div
          style={{
            border: "1px solid var(--hairline, #e5e7eb)",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafbfc", textAlign: "left" }}>
                <Th>Phone Number</Th>
                <Th>State Assignment</Th>
                <Th>Status</Th>
                <Th style={{ width: 80 }}>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderTop: "1px solid #f1f3f5" }}
                >
                  <Td>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {r.number}
                    </span>
                  </Td>
                  <Td>{r.state}</Td>
                  <Td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        background: "#f3f4f6",
                        color: "#13644e",
                      }}
                    >
                      {r.status}
                    </span>
                  </Td>
                  <Td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled
                    >
                      Edit
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p
        className="section-desc"
        style={{ marginTop: 16, maxWidth: 600, fontSize: 12 }}
      >
        Mock data. Number provisioning ships with the telephony integration.
      </p>
    </section>
  );
}

function Th({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: "10px 14px",
        fontSize: 10.5,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        color: "#6b7280",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "11px 14px",
        fontSize: 12.5,
        color: "#0f1729",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
