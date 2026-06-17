"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockupHorizontal } from "../../../(mockups)/_components/BrandMark";

type VerifyState = "loading" | "success" | "stalled";

const POLL_INTERVAL_MS = 2000;
const STALL_TIMEOUT_MS = 30_000;

export function VerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState<VerifyState>("loading");
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!sessionId) {
      setState("stalled");
      return;
    }

    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(
            `/api/billing/subscription-status?session_id=${encodeURIComponent(
              sessionId!
            )}`,
            { cache: "no-store" }
          );
          const json = (await res.json().catch(() => ({}))) as {
            status?: string;
          };
          if (json.status === "active" || json.status === "trialing") {
            if (!cancelled) {
              setState("success");
              setTimeout(() => router.push("/onboarding/firm"), 2000);
            }
            return;
          }
        } catch {}

        if (Date.now() - startedAt.current > STALL_TIMEOUT_MS) {
          if (!cancelled) setState("stalled");
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <LockupHorizontal size="md" />
        </div>

        {state === "loading" && <LoadingPanel />}
        {state === "success" && <SuccessPanel />}
        {state === "stalled" && <StalledPanel />}
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex flex-col items-center text-center">
      <Spinner />
      <h1 className="m-0 mt-6 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Setting Up Your Workspace
      </h1>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7280]">
        We are confirming your subscription and provisioning your workspace.
        This usually takes a few seconds.
      </p>
      <div className="mt-7 h-[3px] w-full max-w-[260px] overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className="h-full w-1/3 rounded-full bg-[#13644e]"
          style={{ animation: "verifyProgress 1.6s ease-in-out infinite" }}
        />
      </div>
      <style>{`
        @keyframes verifyProgress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}

function SuccessPanel() {
  return (
    <div className="flex flex-col items-center text-center">
      <CheckBadge />
      <h1 className="m-0 mt-6 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        You Are In
      </h1>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7280]">
        Workspace ready. Taking you to setup.
      </p>
    </div>
  );
}

function StalledPanel() {
  function refresh() {
    window.location.reload();
  }
  return (
    <div className="flex flex-col items-center text-center">
      <WarningBadge />
      <h1 className="m-0 mt-6 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        This Is Taking Longer Than Expected
      </h1>
      <p className="mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-[#6b7280]">
        Stripe normally confirms your subscription in a few seconds. If you
        already completed checkout, refresh to check again.
      </p>
      <div className="mt-7 grid w-full max-w-[260px] grid-cols-2 gap-2">
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-[34px] items-center justify-center rounded-[6px] bg-[#04261c] text-[12.5px] font-medium text-white hover:bg-[#0d4b3a]"
        >
          Refresh
        </button>
        <Link
          href="mailto:support@nextsurplus.com"
          className="inline-flex h-[34px] items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[12.5px] font-medium text-[#04261c] hover:border-[#04261c]"
        >
          Email Support
        </Link>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
      style={{ animation: "verifySpin 0.9s linear infinite" }}
    >
      <circle
        cx="18"
        cy="18"
        r="15"
        stroke="#e5e7eb"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M18 3 a15 15 0 0 1 15 15"
        stroke="#04261c"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <style>{`@keyframes verifySpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function CheckBadge() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="22" fill="#04261c" />
      <path
        d="M13 22.5L19 28.5L31 16.5"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningBadge() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="22" fill="#b91c1c" />
      <rect x="20.5" y="12" width="3" height="14" rx="1.5" fill="white" />
      <circle cx="22" cy="31" r="2" fill="white" />
    </svg>
  );
}
