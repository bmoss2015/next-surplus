"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "../../(auth)/_actions";
import { LockupHorizontal } from "../../(mockups)/_components/BrandMark";
import { GoogleButton } from "../../(mockups)/_components/GoogleButton";

const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const TESTER_EMAIL = "info@mossyland.com";
const TESTER_PASSWORD = "Anderson1028!$";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.ok) {
        router.push("/");
        router.refresh();
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
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex justify-center">
          <LockupHorizontal size="md" />
        </div>

        <div className="mb-7 text-center">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Welcome Back
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7280]">
            Sign in to your Next Surplus workspace.
          </p>
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

        <GoogleButton variant="outline" />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#6b7280]">
              Work Email
            </label>
            <input
              type="email"
              autoFocus
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[11px] font-medium text-[#6b7280]">
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
              className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
            />
          </div>

          {error && (
            <div className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !email || !password}
            className="mt-2 inline-flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a] disabled:opacity-50"
          >
            {pending ? "Signing In" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-[12px] text-[#6b7280]">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#04261c] hover:underline"
          >
            Create One
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
        </div>
      </div>
    </div>
  );
}
