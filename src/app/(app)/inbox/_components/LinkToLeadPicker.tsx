"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { linkThreadToLead } from "../_actions";

type LeadHit = {
  id: string;
  lead_id: string;
  address: string;
  owner: string | null;
};

export function LinkToLeadPicker({
  threadId,
  onClose,
}: {
  threadId: string;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<LeadHit[]>([]);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const res = await fetch(
        `/api/leads/search?q=${encodeURIComponent(q.trim())}`,
        { cache: "no-store" }
      );
      if (res.ok) setHits(await res.json());
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  function pick(hit: LeadHit) {
    startTransition(async () => {
      await linkThreadToLead(threadId, hit.id);
      onClose();
      window.location.reload();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-[10px] bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="m-0 text-[13px] font-medium text-ink">Link To Lead</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={14} stroke={1.75} />
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <IconSearch
              size={13}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by Lead ID, address, or owner"
              className="w-full rounded-md border border-gray-200 bg-surface pl-7 pr-2 py-[6px] text-[12px] outline-none focus:border-petrol-500"
            />
          </div>
          <div className="mt-3 max-h-[40vh] overflow-y-auto">
            {hits.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-gray-500">
                Type to search.
              </div>
            ) : (
              <ul className="divide-y divide-gray-150">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => pick(h)}
                      className="w-full px-2 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="text-[12px] font-medium text-ink">
                        {h.owner ?? h.lead_id}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {h.lead_id} · {h.address}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
