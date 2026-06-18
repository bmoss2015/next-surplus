"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setMessage("");
    setError(null);
    setDone(false);
  }

  async function submit() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) {
        setError(body.error ?? "Could not send feedback. Please try again.");
      } else {
        setDone(true);
        setMessage("");
      }
    } catch {
      setError("Could not send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send Feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex h-10 w-32 cursor-pointer items-center justify-center rounded-full btn-primary text-[12.5px] font-medium text-white shadow-md hover:shadow-lg"
      >
        Send Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-5 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="m-0 text-[16px] font-semibold text-ink">
                  Send Feedback
                </h2>
                <p className="m-0 mt-1 text-[12px] text-gray-500">
                  Tell us what is working, what is not, or what you wish
                  was here.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="space-y-4">
                <p className="m-0 text-[13.5px] text-gray-600">
                  Thanks. Your note is on its way to the team.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-9 w-24 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What is on your mind?"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-500 focus:outline-none focus:ring-1 focus:ring-petrol-500"
                />
                {error && (
                  <p className="mt-2 text-[12.5px] text-danger">{error}</p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-9 w-24 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending || !message.trim()}
                    className="inline-flex h-9 w-24 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {sending ? "Sending" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
