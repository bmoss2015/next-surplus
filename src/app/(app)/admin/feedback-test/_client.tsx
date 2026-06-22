"use client";

import { useState } from "react";

type Tone = "customer" | "admin";

type SendState = {
  pending: boolean;
  status: "idle" | "success" | "error";
  message: string;
};

const INITIAL_STATE: Record<Tone, SendState> = {
  customer: { pending: false, status: "idle", message: "" },
  admin: { pending: false, status: "idle", message: "" },
};

export function FeedbackEmailTestClient() {
  const [state, setState] = useState<Record<Tone, SendState>>(INITIAL_STATE);

  async function send(tone: Tone) {
    setState((s) => ({
      ...s,
      [tone]: { pending: true, status: "idle", message: "" },
    }));
    try {
      const res = await fetch("/api/admin/feedback-email-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tone }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        recipient?: string;
        error?: string;
      };
      if (!json.ok) {
        setState((s) => ({
          ...s,
          [tone]: {
            pending: false,
            status: "error",
            message: json.error ?? "Could not send",
          },
        }));
        return;
      }
      setState((s) => ({
        ...s,
        [tone]: {
          pending: false,
          status: "success",
          message: `Sent to ${json.recipient ?? "recipient"}`,
        },
      }));
    } catch {
      setState((s) => ({
        ...s,
        [tone]: {
          pending: false,
          status: "error",
          message: "Network error",
        },
      }));
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TestCard
        title="Customer-Facing Reply"
        description="Sent to info@mossyland.com. Shows what the customer sees when you reply to their feedback inside the portal."
        recipient="info@mossyland.com"
        cta="Send Customer Sample"
        state={state.customer}
        onSend={() => send("customer")}
      />
      <TestCard
        title="Admin Notification"
        description="Sent to support@nextsurplus.com. Shows what you see when a customer replies on a ticket."
        recipient="support@nextsurplus.com"
        cta="Send Admin Sample"
        state={state.admin}
        onSend={() => send("admin")}
      />
    </div>
  );
}

function TestCard({
  title,
  description,
  recipient,
  cta,
  state,
  onSend,
}: {
  title: string;
  description: string;
  recipient: string;
  cta: string;
  state: SendState;
  onSend: () => void;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5">
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">
        {description}
      </p>
      <div className="mt-3 text-[11.5px] text-gray-500">
        Recipient:{" "}
        <span className="font-mono text-[11.5px] text-ink">{recipient}</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={state.pending}
          className="btn btn-primary btn-sm"
        >
          {state.pending ? "Sending…" : cta}
        </button>
        {state.status === "success" && (
          <span className="text-[12px] text-petrol-700">{state.message}</span>
        )}
        {state.status === "error" && (
          <span className="text-[12px] text-danger">{state.message}</span>
        )}
      </div>
    </div>
  );
}
