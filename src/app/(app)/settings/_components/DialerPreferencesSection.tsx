"use client";

import { useState } from "react";

export function DialerPreferencesSection() {
  const [autoDialDelay, setAutoDialDelay] = useState<number>(3);
  const [defaultNumberMode, setDefaultNumberMode] = useState<
    "auto" | "perlead" | "all"
  >("auto");
  const [mode, setMode] = useState<"power">("power");

  return (
    <section id="panel-dialer-prefs" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Dialer</a>
        <i className="icon icon-chevron-right" />
        <span>Preferences</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Preferences</h1>
          <p className="section-desc">
            Defaults that apply when your team builds a new dial queue.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 32, maxWidth: 520 }}>
        <Row>
          <Label>Auto Dial Delay</Label>
          <Sub>
            Seconds to wait between calls when running a power dial queue.
          </Sub>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={0}
              max={30}
              value={autoDialDelay}
              onChange={(e) => setAutoDialDelay(Number(e.target.value))}
              style={{
                width: 80,
                height: 36,
                padding: "0 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 13,
                color: "#0f1729",
                background: "#fff",
              }}
            />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Seconds</span>
          </div>
        </Row>

        <Row>
          <Label>Default Number Selection</Label>
          <Sub>
            How the dialer picks which phone number to call when a contact has
            more than one.
          </Sub>
          <select
            value={defaultNumberMode}
            onChange={(e) =>
              setDefaultNumberMode(
                e.target.value as "auto" | "perlead" | "all"
              )
            }
            style={{
              marginTop: 10,
              height: 36,
              width: "100%",
              padding: "0 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              color: "#0f1729",
              background: "#fff",
            }}
          >
            <option value="auto">Auto (Match Lead State)</option>
            <option value="perlead">Choose Per Lead</option>
            <option value="all">Dial All Numbers</option>
          </select>
        </Row>

        <Row>
          <Label>Default Dialing Mode</Label>
          <Sub>
            Power dial runs one call at a time. Preview and multi-line modes
            unlock with the telephony integration.
          </Sub>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "power")}
            style={{
              marginTop: 10,
              height: 36,
              width: "100%",
              padding: "0 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              color: "#0f1729",
              background: "#fff",
            }}
          >
            <option value="power">Power Dial (Single Line)</option>
          </select>
        </Row>
      </div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderTop: "1px solid #f1f3f5",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: "#0f1729",
      }}
    >
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 4,
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
