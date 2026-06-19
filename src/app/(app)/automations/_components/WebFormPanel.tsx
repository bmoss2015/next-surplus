"use client";

import { useState, useTransition } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { saveWebForm } from "../_actions";
import type { WebFormRow } from "../page";
import type { OrgMemberRow } from "@/lib/settings/fetch";
import type { OrgStage } from "@/lib/stages/types";

const APP_BASE =
  typeof window !== "undefined" &&
  window.location.hostname.includes("staging.nextsurplus.com")
    ? "https://staging.nextsurplus.com"
    : "https://app.nextsurplus.com";

export function WebFormPanel({
  form,
  members,
  stages,
}: {
  form: WebFormRow | null;
  members: OrgMemberRow[];
  stages: OrgStage[];
}) {
  const [isActive, setIsActive] = useState(form?.is_active ?? false);
  const [assignmentType, setAssignmentType] = useState<"specific" | "round_robin">(
    form?.assignment_type ?? "specific"
  );
  const [assignedTo, setAssignedTo] = useState(form?.assigned_to ?? "");
  const [rrUsers, setRrUsers] = useState<string[]>(form?.round_robin_users ?? []);
  const [defaultStage, setDefaultStage] = useState(form?.default_stage ?? "new_leads");
  const [successMessage, setSuccessMessage] = useState(form?.success_message ?? "");
  const [embedOpen, setEmbedOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!form) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 text-[13px] text-gray-600">
        No web form has been configured for this workspace.
      </div>
    );
  }

  const formId = form.id;
  const publicUrl = `${APP_BASE}/f/${formId}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="700" frameborder="0" style="border:0"></iframe>`;

  function copy(text: string, which: "url" | "embed") {
    navigator.clipboard.writeText(text);
    if (which === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 1500);
    }
  }

  function save(partial: Omit<Parameters<typeof saveWebForm>[0], "id">) {
    setSaved(false);
    setSaveError(null);
    startTransition(async () => {
      const result = await saveWebForm({ id: formId, ...partial });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        setSaveError(result.error);
      }
    });
  }

  function toggleRrUser(userId: string) {
    const next = rrUsers.includes(userId)
      ? rrUsers.filter((u) => u !== userId)
      : [...rrUsers, userId];
    setRrUsers(next);
    save({ round_robin_users: next });
  }

  function handleToggleActive() {
    const next = !isActive;
    setIsActive(next);
    save({ is_active: next });
  }

  function handleAssignmentType(t: "specific" | "round_robin") {
    setAssignmentType(t);
    save({ assignment_type: t });
  }

  function handleAssignedTo(v: string) {
    setAssignedTo(v);
    save({ assigned_to: v || null });
  }

  function handleStage(v: string) {
    setDefaultStage(v);
    save({ default_stage: v });
  }

  function handleSuccessMessageBlur() {
    save({ success_message: successMessage });
  }

  const cardClass = "rounded-md border border-gray-200 bg-white p-5";
  const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2";
  const inputClass =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[#13644e]";

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Web Form</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            Public-facing inquiry form. Submissions create leads and assign them to your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(saved || saveError || pending) && (
            <span className="text-[11px] text-gray-500">
              {pending ? "Saving..." : saveError ? "Error" : "Saved"}
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-[12px] text-gray-700">
              {isActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={handleToggleActive}
              className={
                "relative h-5 w-9 cursor-pointer rounded-full transition-colors " +
                (isActive ? "bg-[#13644e]" : "bg-gray-300")
              }
              aria-label="Toggle active"
            >
              <span
                className={
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform " +
                  (isActive ? "translate-x-4" : "translate-x-0.5")
                }
              />
            </button>
          </label>
        </div>
      </div>

      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {saveError}
        </div>
      )}

      <section className={cardClass}>
        <div className={labelClass}>Form URL</div>
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className={inputClass + " font-mono text-[12px]"}
          />
          <button
            type="button"
            onClick={() => copy(publicUrl, "url")}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
            {copiedUrl ? "Copied" : "Copy"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setEmbedOpen((v) => !v)}
          className="mt-3 flex cursor-pointer items-center gap-1 text-[12px] text-[#13644e] hover:underline"
        >
          {embedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {embedOpen ? "Hide embed code" : "Show embed code"}
        </button>

        {embedOpen && (
          <div className="mt-3">
            <div className={labelClass}>Embed Code</div>
            <div className="flex items-stretch gap-2">
              <textarea
                readOnly
                value={embedCode}
                rows={2}
                className={inputClass + " font-mono text-[11px]"}
              />
              <button
                type="button"
                onClick={() => copy(embedCode, "embed")}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                {copiedEmbed ? <Check size={14} /> : <Copy size={14} />}
                {copiedEmbed ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className={labelClass}>Assignment</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAssignmentType("specific")}
            className={
              "flex-1 cursor-pointer rounded-md border px-3 py-2 text-[13px] " +
              (assignmentType === "specific"
                ? "border-[#13644e] bg-[#e6f1ec] text-[#0a3d4a]"
                : "border-gray-200 text-gray-700 hover:bg-gray-50")
            }
          >
            Assign To Specific Person
          </button>
          <button
            type="button"
            onClick={() => handleAssignmentType("round_robin")}
            className={
              "flex-1 cursor-pointer rounded-md border px-3 py-2 text-[13px] " +
              (assignmentType === "round_robin"
                ? "border-[#13644e] bg-[#e6f1ec] text-[#0a3d4a]"
                : "border-gray-200 text-gray-700 hover:bg-gray-50")
            }
          >
            Round Robin
          </button>
        </div>

        {assignmentType === "specific" ? (
          <div className="mt-4">
            <label className={labelClass}>Assignee</label>
            <select
              value={assignedTo}
              onChange={(e) => handleAssignedTo(e.target.value)}
              className={inputClass}
            >
              <option value="">No one selected</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4">
            <label className={labelClass}>Participants</label>
            <div className="space-y-1.5">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rrUsers.includes(m.id)}
                    onChange={() => toggleRrUser(m.id)}
                    className="h-4 w-4 cursor-pointer accent-[#13644e]"
                  />
                  <span className="text-[13px] text-gray-700">{m.full_name}</span>
                </label>
              ))}
              {members.length === 0 && (
                <div className="text-[12px] text-gray-500">
                  No team members available.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className={labelClass}>Stage</div>
        <p className="mb-2 text-[12px] text-gray-600">
          Drop new submissions into this pipeline stage.
        </p>
        <select
          value={defaultStage}
          onChange={(e) => handleStage(e.target.value)}
          className={inputClass}
        >
          {stages.length > 0 ? (
            stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          ) : (
            <>
              <option value="new_leads">New Leads</option>
              <option value="qualifying">Qualifying</option>
              <option value="outreach">Outreach</option>
            </>
          )}
        </select>
      </section>

      <section className={cardClass}>
        <div className={labelClass}>Notifications</div>
        <p className="text-[12px] leading-5 text-gray-600">
          When a new submission arrives, the assigned person receives an email notification and a high-priority follow-up task linked to the new lead.
        </p>
      </section>

      <section className={cardClass}>
        <div className={labelClass}>Success Message</div>
        <p className="mb-2 text-[12px] text-gray-600">
          Shown to the submitter after the form is sent.
        </p>
        <textarea
          value={successMessage}
          onChange={(e) => setSuccessMessage(e.target.value)}
          onBlur={handleSuccessMessageBlur}
          rows={3}
          className={inputClass}
        />
      </section>
    </div>
  );
}
