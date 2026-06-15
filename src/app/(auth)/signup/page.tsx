"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "../_actions";
import {
  GoogleSignInButton,
  OrDivider,
} from "../_components/GoogleSignInButton";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"idle" | "session" | "check_email">("idle");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUp(fullName, email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.session) {
        setDone("session");
        router.push("/");
        router.refresh();
      } else {
        setDone("check_email");
      }
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass =
    "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  if (done === "check_email") {
    return (
      <div className="space-y-4 text-center">
        <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
          Check Your Email
        </h1>
        <p className="text-[13px] text-gray-600">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          finish creating your account.
        </p>
        <Link
          href="/login"
          className="inline-block text-[12px] text-petrol-500 hover:text-petrol-700"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
        Create Account
      </h1>
      <GoogleSignInButton label="Sign up with Google" />
      <OrDivider />
      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          autoFocus
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Password</label>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <div className="mt-1 text-[10px] text-gray-400">
          At least 8 characters.
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !fullName || !email || password.length < 8}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating Account" : "Create Account"}
      </button>
      <p className="text-center text-[11px] text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-petrol-500 hover:text-petrol-700"
        >
          Sign In
        </Link>
      </p>
      <p className="text-center text-[10px] text-gray-400">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline hover:text-gray-600">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-gray-600">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
