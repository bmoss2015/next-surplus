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
  IconSearch,
  IconArrowsSort,
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
          <h1 className="text-[22px] font-medium tracking-tight">Email Templates · 3 directions</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Three takes on the same data. No tinted pills, no decoration filler — just hierarchy and whitespace doing the work.
          </p>
        </header>

        <Variant
          letter="A"
          title="Grid Cards"
          anchor="Notion gallery view · Vercel template gallery · Stripe email templates"
          pitch="Scannable at a glance. Subject preview as the hook. Hover lifts the card. Folder filter as quiet tabs at the top."
        >
          <VariantA />
        </Variant>

        <Variant
          letter="B"
          title="Spreadsheet Table"
          anchor="Linear list view · Vercel dashboard · GitHub repo lists"
          pitch="Dense, sortable, no decoration. Best when you have many templates and want to scan/sort by usage or last touched."
        >
          <VariantB />
        </Variant>

        <Variant
          letter="C"
          title="Editorial Stack"
          anchor="Substack writer dashboard · Notion page list · Apple Notes"
          pitch="Quiet, generous whitespace, big type. Folders as collapsible sections. Hover reveals row actions."
        >
          <VariantC />
        </Variant>
      </div>
    </div>
  );
}

function Variant({
  letter,
  title,
  anchor,
  pitch,
  children,
}: {
  letter: string;
  title: string;
  anchor: string;
  pitch: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[14px] font-semibold text-gray-500">
          {letter}
        </span>
        <div>
          <h2 className="text-[17px] font-medium tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[12px] text-gray-500">{anchor}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#0f1729]">{pitch}</p>
        </div>
      </div>
      {children}
    </section>
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
            className="group cursor-pointer rounded-[10px] border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,41,0.08)]"
          >
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              {t.folder}
            </div>
            <h4 className="mt-1.5 text-[13.5px] font-semibold leading-snug text-[#0f1729]">
              {t.name}
            </h4>
            <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-gray-500">
              {t.preview}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
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
          </article>
        ))}
      </div>
    </div>
  );
}

function VariantB() {
  const [sortBy, setSortBy] = useState<"name" | "used" | "lastUsed">("lastUsed");
  const [folder, setFolder] = useState<"All" | "Outreach" | "Closing">("All");

  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Settings</div>
          <h3 className="mt-0.5 text-[15px] font-medium">Email Templates</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch size={12} stroke={1.75} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search templates..."
              className="rounded-md border border-gray-200 bg-white py-1.5 pl-7 pr-3 text-[12px] outline-none placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
          <button className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-white">
            <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
            New Template
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-150 bg-gray-50/40 px-6 py-2.5 text-[11px] text-gray-500">
        <span className="font-medium">Folder:</span>
        {(["All", "Outreach", "Closing"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={
              "cursor-pointer rounded-md px-2 py-1 transition-colors " +
              (folder === f ? "bg-white text-[#0f1729] shadow-sm" : "hover:text-[#0f1729]")
            }
          >
            {f}
          </button>
        ))}
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-150 bg-gray-50/40 text-[10.5px] uppercase tracking-[0.08em] text-gray-500">
            <Th onClick={() => setSortBy("name")} active={sortBy === "name"}>
              Name
            </Th>
            <Th>Folder</Th>
            <Th onClick={() => setSortBy("lastUsed")} active={sortBy === "lastUsed"}>
              Last Used
            </Th>
            <Th onClick={() => setSortBy("used")} active={sortBy === "used"} align="right">
              Sends
            </Th>
            <Th align="right">Open Rate</Th>
            <Th align="right">Reply Rate</Th>
            <th className="w-[120px] px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {TEMPLATES.filter((t) => folder === "All" || t.folder === folder).map((t) => (
            <tr key={t.id} className="group cursor-pointer hover:bg-gray-50/50">
              <td className="px-3 py-2.5">
                <div className="text-[12.5px] font-medium text-[#0f1729]">{t.name}</div>
                <div className="mt-0.5 truncate text-[11px] text-gray-500">{t.subject}</div>
              </td>
              <td className="px-3 py-2.5 text-[12px] text-gray-500">{t.folder}</td>
              <td className="px-3 py-2.5 text-[12px] text-gray-500">{t.lastUsed}</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-medium tabular-nums">
                {t.used}
              </td>
              <td className="px-3 py-2.5 text-right text-[13px] tabular-nums">
                {t.openRate}%
              </td>
              <td className={
                "px-3 py-2.5 text-right text-[13px] tabular-nums " +
                (t.replyRate >= 20 ? "font-semibold text-[#0f1729]" : "text-gray-700")
              }>
                {t.replyRate}%
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn icon={IconPencil} label="Edit" />
                  <IconBtn icon={IconCopy} label="Duplicate" />
                  <IconBtn icon={IconTrash} label="Delete" danger />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  align?: "left" | "right";
}) {
  return (
    <th className="px-3 py-2.5">
      <button
        onClick={onClick}
        className={
          "inline-flex cursor-pointer items-center gap-1 " +
          (active ? "text-[#0f1729]" : "hover:text-[#0f1729]") +
          (align === "right" ? " ml-auto" : "")
        }
      >
        {children}
        {onClick && <IconArrowsSort size={10} stroke={1.75} className={active ? "" : "opacity-40"} />}
      </button>
    </th>
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
    <div className="rounded-[12px] border border-gray-200 bg-white px-2 py-2 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
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
                      <span className={t.replyRate >= 20 ? "text-[#0f1729]" : ""}>
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
