"use client";

import Link from "next/link";

const VARIANTS = [
  { slug: "a", label: "A. Hairline" },
  { slug: "b", label: "B. Wordmark" },
  { slug: "c", label: "C. Brand Strip" },
  { slug: "d", label: "D. Progress" },
  { slug: "e", label: "E. No Header" },
];

export function V2VariantNav({ active }: { active: string }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] shadow-md">
      <span className="mr-1 text-gray-500">v2 headers:</span>
      {VARIANTS.map((v) => (
        <Link
          key={v.slug}
          href={`/admin/imap-mockup/v2/${v.slug}`}
          className={`rounded-full px-2 py-0.5 font-medium ${
            active === v.slug
              ? "bg-[#0d4b3a] text-white"
              : "text-petrol-500 hover:bg-petrol-50"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
