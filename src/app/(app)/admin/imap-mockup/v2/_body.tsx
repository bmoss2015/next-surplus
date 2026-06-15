"use client";

import { IconCheck, IconChevronRight } from "@tabler/icons-react";
import { PRESETS } from "../_shared";

// Shared modal body used by every v2 header variant. Lets the header
// experiments share the same step-wizard so we can compare apples to
// apples.

export function V2Body() {
  return (
    <>
      <div className="px-7 pt-6 pb-2">
        <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-tight text-ink">
          Sign In With Fastmail
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
          Three short steps. The platform handles the rest.
        </p>
      </div>

      <div className="px-7 py-5">
        <Step n={1} title="Pick Your Provider" done body="Fastmail selected" />
        <Step
          n={2}
          title="Sign In"
          active
          body="Enter the email and app password for the inbox you want to connect."
        >
          <div className="mt-4 space-y-3">
            <BigInput placeholder="Email Address" />
            <BigInput placeholder="App Password" type="password" />
          </div>
        </Step>
        <Step
          n={3}
          title="Confirm Connection"
          body="The platform tests the connection before saving."
        />
      </div>

      <div className="border-t border-gray-100 px-7 py-5">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md btn-primary text-[14px] font-medium text-white">
          Continue
          <IconChevronRight size={16} stroke={2.4} />
        </button>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-7 py-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
          <span>Or pick another:</span>
          {PRESETS.filter((p) => p.label !== "Fastmail").map((p) => (
            <button
              key={p.label}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 hover:border-gray-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Step({
  n,
  title,
  body,
  done,
  active,
  children,
}: {
  n: number;
  title: string;
  body?: string;
  done?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative pb-6 pl-10 last:pb-0">
      <div
        className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-semibold ${
          done
            ? "bg-[#0d4b3a] text-white"
            : active
              ? "border-2 border-[#0d4b3a] bg-white text-[#0d4b3a]"
              : "border border-gray-300 bg-white text-gray-400"
        }`}
      >
        {done ? <IconCheck size={14} stroke={3} /> : n}
      </div>
      {n < 3 && (
        <div className="absolute left-[13.5px] top-7 h-[calc(100%-12px)] w-px bg-gray-200" />
      )}
      <div
        className={`text-[13.5px] font-semibold ${
          active || done ? "text-ink" : "text-gray-400"
        }`}
      >
        {title}
      </div>
      {body && (
        <div
          className={`mt-1 text-[12px] leading-relaxed ${
            active || done ? "text-gray-600" : "text-gray-400"
          }`}
        >
          {body}
        </div>
      )}
      {children}
    </div>
  );
}

function BigInput({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="block h-11 w-full rounded-md border border-gray-200 bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-[#0d4b3a]"
    />
  );
}
