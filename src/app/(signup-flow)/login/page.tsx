"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "../../(auth)/_actions";
import { createClient } from "@/lib/supabase/client";

const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const TESTER_EMAIL = "info@mossyland.com";
const TESTER_PASSWORD = "Anderson1028!$";

function postLoginDestination() {
  if (typeof window === "undefined") return "/";
  const host = window.location.host;
  if (host === "nextsurplus.com" || host === "www.nextsurplus.com") {
    return "https://app.nextsurplus.com/";
  }
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  function goToApp() {
    const dest = postLoginDestination();
    if (dest.startsWith("http")) {
      window.location.assign(dest);
    } else {
      router.push(dest);
      router.refresh();
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.ok) {
        goToApp();
      } else {
        setError(result.error);
      }
    });
  }

  function signInAsTester() {
    setError(null);
    startTransition(async () => {
      const result = await signIn(TESTER_EMAIL, TESTER_PASSWORD);
      if (result.ok) {
        goToApp();
      } else {
        setError(result.error);
      }
    });
  }

  async function continueWithGoogle() {
    setError(null);
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        scopes: "openid email profile",
      },
    });
    if (error) {
      setError(error.message);
      setGooglePending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex justify-center">
          <BrandLockupInline />
        </div>

        <div className="mb-7 text-center">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Log In To Next Surplus
          </h1>
        </div>

        {IS_PREVIEW && (
          <div className="mb-5 rounded-[6px] border border-[#04261c] bg-white p-3 text-center">
            <button
              type="button"
              onClick={signInAsTester}
              disabled={pending}
              className="inline-flex h-[34px] w-full items-center justify-center rounded-[5px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a] disabled:opacity-50"
            >
              {pending ? "Signing In" : "Sign In As Tester"}
            </button>
            <div className="mt-2 text-[10.5px] text-[#6b7280]">
              Preview deployment. One click to land on the dashboard.
            </div>
          </div>
        )}

        <GoogleButton onClick={continueWithGoogle} pending={googlePending} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-[#374151]">
              Work Email
            </label>
            <input
              type="email"
              autoFocus
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[11.5px] font-medium text-[#374151]">
                Password
              </label>
              <Link
                href="/forgot"
                className="text-[11px] text-[#13644e] hover:text-[#04261c]"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
            />
          </div>

          {error && (
            <p className="text-[12px] leading-relaxed text-[#b91c1c]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !email || !password}
            className="mt-2 inline-flex h-[40px] w-full items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:opacity-50"
          >
            {pending ? "Logging In" : "Log In"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-[#6b7280]">
          <span>No Account Yet?</span>
          <Link
            href="/signup"
            className="font-semibold text-[#04261c] hover:underline"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-4 text-[10.5px] text-[#9ca3af]">
          <Link href="/terms" className="hover:text-[#04261c]">
            Terms
          </Link>
          <span aria-hidden>&middot;</span>
          <Link href="/privacy" className="hover:text-[#04261c]">
            Privacy
          </Link>
          <span aria-hidden>&middot;</span>
          <a
            href="mailto:support@nextsurplus.com"
            className="hover:text-[#04261c]"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}

function BrandLockupInline() {
  return (
    <svg
      viewBox="0 0 460 80"
      width="184"
      height="32"
      aria-label="Next Surplus"
      style={{ display: "block" }}
    >
      <polygon points="40,26 54,40 40,54 26,40" fill="#ffffff" />
      <polygon points="40,26 54,40 40,40" fill="#13644e" />
      <polygon points="40,40 54,40 40,54" fill="#4a9c75" />
      <text
        x="90"
        y="56"
        fontFamily="Inter, 'Plus Jakarta Sans', system-ui, sans-serif"
        fontSize="42"
        fontWeight="500"
        fill="#04261c"
        letterSpacing="-0.5"
        wordSpacing="6"
      >
        Next Surplus
      </text>
    </svg>
  );
}

function GoogleButton({
  onClick,
  pending,
}: {
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white text-[13.5px] font-medium text-[#04261c] transition-colors duration-150 ease-out hover:bg-[#f5f5f5] disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      <span>{pending ? "Redirecting" : "Continue With Google"}</span>
    </button>
  );
}
