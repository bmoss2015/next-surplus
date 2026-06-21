"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type FeedbackType = "bug" | "idea" | "question";

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "bug", label: "Bug" },
  { value: "question", label: "Question" },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setType("idea");
    setTitle("");
    setBody("");
    setError(null);
    setDone(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(reset, 200);
  }, [reset]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim(),
          pageUrl: pathname,
        }),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not send feedback. Please try again.");
      } else {
        setDone(true);
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
        className="cursor-pointer text-[13px] font-medium text-gray-600 hover:text-ink"
      >
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send Feedback"
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="flex h-full w-full max-w-[440px] flex-col bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="m-0 text-[16px] font-semibold text-ink">
                  Send Feedback
                </h2>
                <p className="m-0 mt-1 text-[12.5px] text-gray-500">
                  Bree reads every one. Replies in under two days.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="text-[15px] font-semibold text-ink">
                  Got It
                </div>
                <p className="mt-2 max-w-[280px] text-[13.5px] text-gray-600">
                  Your feedback is logged. Bree reads every one and usually
                  replies within two days.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 inline-flex h-9 w-28 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
                <div className="mb-5">
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map((opt) => {
                      const active = type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setType(opt.value)}
                          className={
                            active
                              ? "flex h-9 cursor-pointer items-center justify-center rounded-md bg-ink text-[13px] font-medium text-white"
                              : "flex h-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="feedback-title"
                    className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-gray-500"
                  >
                    Title
                  </label>
                  <input
                    id="feedback-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                    placeholder="One line summary"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-500 focus:outline-none focus:ring-1 focus:ring-petrol-500"
                  />
                </div>

                <div className="mb-5 flex-1">
                  <label
                    htmlFor="feedback-body"
                    className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-gray-500"
                  >
                    Description
                  </label>
                  <textarea
                    id="feedback-body"
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What is on your mind?"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-500 focus:outline-none focus:ring-1 focus:ring-petrol-500"
                  />
                </div>

                {error && (
                  <p className="mb-3 text-[12.5px] text-danger">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-9 w-28 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending || !title.trim() || !body.trim()}
                    className="inline-flex h-9 w-28 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {sending ? "Sending" : "Send Feedback"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
