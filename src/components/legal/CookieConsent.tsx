"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ns_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "essential-only");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(15,23,41,0.06)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-[13px] leading-relaxed text-gray-600">
          We use essential cookies only. No tracking cookies. See our{" "}
          <a
            href="/privacy"
            className="text-petrol-700 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          {" "}for details.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-9 w-24 shrink-0 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
        >
          OK
        </button>
      </div>
    </div>
  );
}
