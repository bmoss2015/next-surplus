"use client";

// Settings clone · Phase C.5 — Templates wired to real data (display).
//
// Three internal tabs that share a single state: Email, SMS, Research.
// Email and SMS pull from TemplateRow[] (channel filter), Research pulls
// from ResearchTemplateRow[] which has its own table. The Add Template,
// Edit pencil, and Delete buttons are visual-only — Phase D wires the
// template-editor drawer (upsertMailTemplate / deleteMailTemplate, plus
// the research-template equivalents).

import { useMemo, useState } from "react";
import type {
  ResearchTemplateRow,
  TemplateRow,
} from "@/lib/settings/fetch";

type Tab = "email" | "sms" | "research";

export function TemplatesSection({
  templates,
  research,
}: {
  templates: TemplateRow[];
  research: ResearchTemplateRow[];
}) {
  const [tab, setTab] = useState<Tab>("email");

  const email = useMemo(
    () => templates.filter((t) => t.channel.toLowerCase() === "email"),
    [templates]
  );
  const sms = useMemo(
    () => templates.filter((t) => t.channel.toLowerCase() === "sms"),
    [templates]
  );

  const counts = {
    email: email.length,
    sms: sms.length,
    research: research.length,
  };

  const crumbLabel =
    tab === "email" ? "Email" : tab === "sms" ? "SMS" : "Research";
  const addLabel =
    tab === "email"
      ? "Add Email Template"
      : tab === "sms"
        ? "Add SMS Template"
        : "Add Research Template";

  return (
    <section id="panel-templates" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Templates</a>
        <i className="icon icon-chevron-right" />
        <span>{crumbLabel}</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Templates</h1>
          <p className="section-desc">
            Reusable email bodies, SMS messages, and research checklists with
            merge fields.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled
          title="Template editor drawer ships in Phase D"
        >
          <i className="icon icon-plus" /> {addLabel}
        </button>
      </div>

      <div className="tpl-tabs">
        <button
          type="button"
          className={"tpl-tab" + (tab === "email" ? " active" : "")}
          onClick={() => setTab("email")}
        >
          Email<span className="tpl-tab-count">{counts.email}</span>
        </button>
        <button
          type="button"
          className={"tpl-tab" + (tab === "sms" ? " active" : "")}
          onClick={() => setTab("sms")}
        >
          SMS<span className="tpl-tab-count">{counts.sms}</span>
        </button>
        <button
          type="button"
          className={"tpl-tab" + (tab === "research" ? " active" : "")}
          onClick={() => setTab("research")}
        >
          Research<span className="tpl-tab-count">{counts.research}</span>
        </button>
      </div>

      {tab === "email" && <EmailList rows={email} />}
      {tab === "sms" && <SmsList rows={sms} />}
      {tab === "research" && <ResearchList rows={research} />}
    </section>
  );
}

function EmptyRow({ msg }: { msg: string }) {
  return (
    <div className="list-row" style={{ color: "var(--text-3)", fontSize: 13 }}>
      {msg}
    </div>
  );
}

function RowActions() {
  return (
    <div className="overflow flex items-center gap-0.5 ml-2">
      <div
        className="icon-btn"
        title="Edit (ships Phase D)"
        style={{ opacity: 0.4, pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          <path d="m15 5 4 4" />
        </svg>
      </div>
      <div
        className="icon-btn"
        title="Delete (ships Phase D)"
        style={{ opacity: 0.4, pointerEvents: "none" }}
      >
        <i className="icon icon-trash" />
      </div>
    </div>
  );
}

function EmailList({ rows }: { rows: TemplateRow[] }) {
  return (
    <div className="tpl-pane active">
      <div className="list">
        {rows.length === 0 ? (
          <EmptyRow msg="No email templates yet. Add one to use it from the lead composer." />
        ) : (
          rows.map((t) => (
            <div key={t.id} className="list-row">
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium">{t.name}</div>
                <div className="text-[12px] text-2 mt-0.5 tabular">
                  {t.subject ? `Subject: ${t.subject}` : "No subject"}
                  {t.state && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="chip" style={{ fontSize: 10.5 }}>
                        {t.state}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <RowActions />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SmsList({ rows }: { rows: TemplateRow[] }) {
  return (
    <div className="tpl-pane active">
      <div className="list">
        {rows.length === 0 ? (
          <EmptyRow msg="No SMS templates yet." />
        ) : (
          rows.map((t) => (
            <div key={t.id} className="list-row">
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium">{t.name}</div>
                <div className="text-[12px] text-2 mt-0.5">
                  &ldquo;{t.body.length > 140 ? t.body.slice(0, 140) + "…" : t.body}&rdquo;
                  {t.state && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="chip" style={{ fontSize: 10.5 }}>
                        {t.state}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <RowActions />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ResearchList({ rows }: { rows: ResearchTemplateRow[] }) {
  return (
    <div className="tpl-pane active">
      <div className="list">
        {rows.length === 0 ? (
          <EmptyRow msg="No research templates yet." />
        ) : (
          rows.map((r) => (
            <div key={r.id} className="list-row">
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium">{r.name}</div>
                <div className="text-[12px] text-2 mt-0.5 tabular">
                  {r.state && (
                    <span className="chip" style={{ fontSize: 10.5 }}>
                      {r.state}
                    </span>
                  )}
                  {r.sale_type && (
                    <>
                      {" "}
                      <span className="chip" style={{ fontSize: 10.5 }}>
                        {r.sale_type === "TAX" ? "Tax" : "Mortgage"}
                      </span>
                    </>
                  )}{" "}
                  · {r.steps.length} step{r.steps.length === 1 ? "" : "s"}
                </div>
              </div>
              <RowActions />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
