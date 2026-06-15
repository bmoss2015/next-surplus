"use client";

import { useState } from "react";
import { IconGripVertical, IconTrash, IconPlus } from "@tabler/icons-react";

type Disposition = {
  id: string;
  label: string;
  tone: "good" | "neutral" | "info" | "muted" | "bad" | "stop";
};

const SEED: Disposition[] = [
  { id: "d1", label: "Answered, Interested", tone: "good" },
  { id: "d2", label: "Answered, Not Interested", tone: "neutral" },
  { id: "d3", label: "Answered, Callback Requested", tone: "info" },
  { id: "d4", label: "No Answer", tone: "muted" },
  { id: "d5", label: "Left Voicemail", tone: "muted" },
  { id: "d6", label: "Wrong Number", tone: "bad" },
  { id: "d7", label: "Disconnected", tone: "bad" },
  { id: "d8", label: "Do Not Contact", tone: "stop" },
];

const TONE_LABEL: Record<Disposition["tone"], string> = {
  good: "Positive",
  neutral: "Neutral",
  info: "Schedule",
  muted: "No Contact",
  bad: "Mark Number",
  stop: "Suppress Lead",
};

const TONE_STYLE: Record<Disposition["tone"], React.CSSProperties> = {
  good: { background: "#f3f4f6", color: "#13644e" },
  neutral: { background: "#f3f4f6", color: "#374151" },
  info: { background: "#ddd6fe", color: "#3c3489" },
  muted: { background: "#f3f4f6", color: "#6b7280" },
  bad: { background: "#fef2f2", color: "#b91c1c" },
  stop: { background: "#0f1729", color: "#ffffff" },
};

export function DialerDispositionsSection() {
  const [rows, setRows] = useState<Disposition[]>(SEED);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function remove(id: string) {
    if (pendingDelete === id) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setPendingDelete(null);
    } else {
      setPendingDelete(id);
    }
  }

  return (
    <section id="panel-dialer-dispositions" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Dialer</a>
        <i className="icon icon-chevron-right" />
        <span>Dispositions</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Dispositions</h1>
          <p className="section-desc">
            Buttons your team taps after each call to record the outcome. Drag
            to reorder. Tone controls how the option looks in the call modal.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled>
          <IconPlus size={14} stroke={2} /> Add Disposition
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {rows.map((d) => (
            <div
              key={d.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 140px 80px",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderTop: "1px solid #f1f3f5",
              }}
            >
              <button
                type="button"
                aria-label="Reorder"
                title="Drag to Reorder"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  background: "transparent",
                  border: 0,
                  cursor: "grab",
                }}
              >
                <IconGripVertical size={16} stroke={1.75} />
              </button>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#0f1729",
                }}
              >
                {d.label}
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    ...TONE_STYLE[d.tone],
                  }}
                >
                  {TONE_LABEL[d.tone]}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  className="btn btn-outline btn-sm"
                  style={
                    pendingDelete === d.id
                      ? { borderColor: "#b91c1c", color: "#b91c1c" }
                      : undefined
                  }
                >
                  <IconTrash size={12} stroke={2} />
                  {pendingDelete === d.id ? "Confirm" : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div
              style={{
                padding: "32px 14px",
                textAlign: "center",
                fontSize: 12.5,
                color: "#6b7280",
              }}
            >
              No dispositions. Add at least one so your team can log call
              outcomes.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
