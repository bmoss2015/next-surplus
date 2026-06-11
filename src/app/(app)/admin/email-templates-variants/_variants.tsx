"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPencil,
  IconCopy,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
} from "@tabler/icons-react";

type Template = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  folder: "Outreach" | "Closing";
  updated: string;
  used: number;
  lastUsed: string;
  openRate: number;
  replyRate: number;
};

const TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Opening Outreach — Tax Sale",
    subject: "Following up on your tax sale surplus claim",
    preview: "Hi {{contact.first_name}}, I'm following up on the surplus funds from your tax sale at {{lead.property_address}}...",
    folder: "Outreach",
    updated: "2 days ago",
    used: 14,
    lastUsed: "Yesterday",
    openRate: 71,
    replyRate: 14,
  },
  {
    id: "t2",
    name: "Opening Outreach — Mortgage Foreclosure",
    subject: "Surplus funds from your foreclosure",
    preview: "Hi {{contact.first_name}}, our research shows you may be entitled to surplus funds from the recent foreclosure...",
    folder: "Outreach",
    updated: "1 week ago",
    used: 6,
    lastUsed: "5 days ago",
    openRate: 50,
    replyRate: 0,
  },
  {
    id: "t3",
    name: "Soft Follow-up (Day 3)",
    subject: "Quick check in, {{contact.first_name}}",
    preview: "Just checking in to see if you had a chance to review my note from earlier this week...",
    folder: "Outreach",
    updated: "2 weeks ago",
    used: 22,
    lastUsed: "2 hours ago",
    openRate: 86,
    replyRate: 23,
  },
  {
    id: "t4",
    name: "Send Contract For Signature",
    subject: "Contract ready for your signature",
    preview: "Attached is the contract for your review. Once signed we'll file the claim with the county on your behalf...",
    folder: "Closing",
    updated: "3 days ago",
    used: 9,
    lastUsed: "4 days ago",
    openRate: 100,
    replyRate: 78,
  },
  {
    id: "t5",
    name: "Welcome — Onboarding",
    subject: "Welcome aboard, {{contact.first_name}}",
    preview: "Welcome! Here's what to expect over the next 90 days as we work your claim through the courts...",
    folder: "Closing",
    updated: "last month",
    used: 4,
    lastUsed: "2 weeks ago",
    openRate: 100,
    replyRate: 50,
  },
];

export function TemplatesVariants() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] py-12 text-[#0f1729]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mx-auto max-w-[1100px] space-y-20 px-8">
        <header>
          <h1 className="text-[22px] font-medium tracking-tight">Email Templates</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Two directions side by side. Same data.
          </p>
        </header>

        <section>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="text-[11px] text-gray-400">A · Grid Cards</span>
          </div>
          <VariantA />
        </section>

        <section>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="text-[11px] text-gray-400">C · Editorial Stack</span>
            <span className="text-[11.5px] text-gray-500">Notion · Substack · Apple Notes</span>
          </div>
          <VariantC />
        </section>
      </div>
    </div>
  );
}

function VariantA() {
  const [folder, setFolder] = useState<"All" | "Outreach" | "Closing">("All");
  const visible = TEMPLATES.filter((t) => folder === "All" || t.folder === folder);

  return (
    <div className="rounded-[12px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Settings</div>
          <h3 className="mt-0.5 text-[15px] font-medium">Email Templates</h3>
          <p className="mt-1 text-[12px] text-gray-500">5 templates · 2 folders</p>
        </div>
        <button className="btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white">
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </div>

      <div className="mb-5 flex items-center gap-1.5 border-b border-gray-150">
        {(["All", "Outreach", "Closing"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={
              "-mb-px cursor-pointer border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors " +
              (folder === f
                ? "border-[#0f1729] text-[#0f1729]"
                : "border-transparent text-gray-500 hover:text-[#0f1729]")
            }
          >
            {f}
            <span className="ml-1.5 text-[11px] text-gray-400">
              {f === "All" ? TEMPLATES.length : TEMPLATES.filter((t) => t.folder === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => (
          <article
            key={t.id}
            className="group flex h-full cursor-pointer flex-col rounded-[10px] border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,41,0.08)]"
          >
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              {t.folder}
            </div>
            <h4 className="mt-1.5 line-clamp-2 min-h-[2.4rem] text-[13.5px] font-semibold leading-snug text-[#0f1729]">
              {t.name}
            </h4>
            <p className="mt-2 line-clamp-3 min-h-[3.5rem] text-[11.5px] leading-relaxed text-gray-500">
              {t.preview}
            </p>
            <div className="mt-auto pt-4">
              <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                <Stat label="Sends" value={String(t.used)} />
                <Stat label="Open Rate" value={`${t.openRate}%`} />
                <Stat label="Reply Rate" value={`${t.replyRate}%`} emphasize={t.replyRate >= 20} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10.5px] text-gray-400">Last used {t.lastUsed.toLowerCase()}</div>
                <div className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn icon={IconPencil} label="Edit" />
                  <IconBtn icon={IconCopy} label="Duplicate" />
                  <IconBtn icon={IconTrash} label="Delete" danger />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


function VariantC() {
  const [openFolders, setOpenFolders] = useState<Set<"Outreach" | "Closing">>(
    new Set(["Outreach", "Closing"])
  );

  function toggleFolder(name: "Outreach" | "Closing") {
    const next = new Set(openFolders);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setOpenFolders(next);
  }

  return (
    <div className="rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-end justify-between px-6 py-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Settings</div>
          <h3 className="mt-0.5 text-[16px] font-medium tracking-tight">Email Templates</h3>
          <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-gray-500">
            Reusable bodies with merge fields. Saved here, used from any lead&apos;s compose modal.
          </p>
        </div>
        <button className="btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white">
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </div>

      {(["Outreach", "Closing"] as const).map((folderName) => (
        <div key={folderName} className="border-t border-gray-100">
          <button
            onClick={() => toggleFolder(folderName)}
            className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 hover:bg-gray-50/40"
          >
            {openFolders.has(folderName) ? (
              <IconChevronDown size={14} stroke={2} className="text-gray-400" />
            ) : (
              <IconChevronRight size={14} stroke={2} className="text-gray-400" />
            )}
            <IconFolder size={14} stroke={1.75} className="text-gray-400" />
            <span className="text-[13.5px] font-semibold">{folderName}</span>
            <span className="text-[11.5px] text-gray-400">
              {TEMPLATES.filter((t) => t.folder === folderName).length}
            </span>
          </button>

          {openFolders.has(folderName) && (
            <div>
              {TEMPLATES.filter((t) => t.folder === folderName).map((t) => (
                <div
                  key={t.id}
                  className="group grid cursor-pointer grid-cols-[1fr_auto] items-start gap-6 border-t border-gray-50 px-6 py-5 hover:bg-gray-50/40"
                >
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-medium leading-snug tracking-tight">
                      {t.name}
                    </h4>
                    <p className="mt-1 truncate text-[12.5px] text-gray-500">{t.subject}</p>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-[12px] leading-relaxed text-gray-400">
                      {t.preview}
                    </p>
                    <div className="mt-3 flex items-center gap-5 text-[11px] text-gray-400">
                      <span>
                        <span className="font-medium tabular-nums text-gray-600">{t.used}</span> sends
                      </span>
                      <span>
                        <span className="font-medium tabular-nums text-gray-600">{t.openRate}%</span> open
                      </span>
                      <span>
                        <span className={"font-medium tabular-nums " + (t.replyRate >= 20 ? "text-[#0f1729]" : "text-gray-600")}>{t.replyRate}%</span> reply
                      </span>
                      <span>Last used {t.lastUsed.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn icon={IconPencil} label="Edit" />
                    <IconBtn icon={IconCopy} label="Duplicate" />
                    <IconBtn icon={IconTrash} label="Delete" danger />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-gray-400">{label}</div>
      <div
        className={
          "mt-0.5 text-[14px] tabular-nums tracking-tight " +
          (emphasize ? "font-semibold text-[#0f1729]" : "font-medium text-gray-700")
        }
      >
        {value}
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  danger,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={
        "cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors " +
        (danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-gray-100 hover:text-[#0f1729]")
      }
    >
      <Icon size={14} stroke={1.75} />
    </button>
  );
}
