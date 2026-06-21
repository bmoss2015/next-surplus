"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SendingDomainRow } from "@/lib/sending-domains/fetch";
import { disconnectSendingDomain } from "@/lib/sending-domains/actions";
import { AddDomainWizard } from "./AddDomainWizard";

export function SendingDomainsSection({
  initial,
}: {
  initial: SendingDomainRow[];
}) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <section id="panel-sending-domains" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span>Sending Domains</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Sending Domains</h1>
          <p className="section-desc">
            Send email from your own domain through Next Surplus. Recipients
            see your address as the sender.
          </p>
        </div>
        {initial.length > 0 && (
          <button
            type="button"
            className="btn btn-primary cursor-pointer"
            onClick={() => setWizardOpen(true)}
          >
            Add Domain
          </button>
        )}
      </div>

      {initial.length === 0 ? (
        <EmptyState onAdd={() => setWizardOpen(true)} />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {initial.map((d) => (
            <DomainCard key={d.id} domain={d} />
          ))}
        </div>
      )}

      <AddDomainWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-surface p-8 text-center">
      <h2 className="m-0 mb-1 text-[15px] font-medium text-ink">
        No Domains Connected
      </h2>
      <p className="m-0 mb-5 text-[13px] text-gray-500">
        Connect your domain to send email from your own address. Setup
        takes 2 to 5 clicks depending on your DNS provider.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-10 w-52 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
      >
        Add Domain
      </button>
    </div>
  );
}

function DomainCard({ domain }: { domain: SendingDomainRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const statusLabel =
    domain.status === "verified"
      ? "Verified"
      : domain.status === "verifying"
        ? "Verifying"
        : domain.status === "failed"
          ? "Failed"
          : "Pending";

  function onClickDisconnect() {
    if (!confirming) {
      setConfirming(true);
      setErr(null);
      return;
    }
    startTransition(async () => {
      const res = await disconnectSendingDomain(domain.id);
      if (!res.ok) {
        setErr(res.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background:
                  domain.status === "verified"
                    ? "#13644e"
                    : domain.status === "failed"
                      ? "var(--danger)"
                      : "#9ca3af",
              }}
            />
            <span className="text-[14px] font-medium text-ink">
              {domain.domain}
            </span>
            <span className="text-[11.5px] text-gray-500">{statusLabel}</span>
          </div>
          <div className="mt-1 text-[12px] text-gray-500">
            Sending via {domain.subdomain}
            {domain.detected_provider &&
              ` · DNS at ${prettyProvider(domain.detected_provider)}`}
          </div>
          {err && (
            <div
              className="mt-1 text-[11.5px]"
              style={{ color: "var(--danger)" }}
            >
              {err}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm cursor-pointer"
          onClick={onClickDisconnect}
          disabled={pending}
          style={
            confirming
              ? { color: "var(--danger)", borderColor: "var(--danger)" }
              : undefined
          }
        >
          {pending
            ? "Disconnecting"
            : confirming
              ? "Click Again To Confirm"
              : "Disconnect"}
        </button>
      </div>
    </div>
  );
}

function prettyProvider(id: string): string {
  const map: Record<string, string> = {
    cloudflare: "Cloudflare",
    vercel: "Vercel",
    godaddy: "GoDaddy",
    namecheap: "Namecheap",
    ionos: "IONOS",
    bluehost: "Bluehost",
    hostgator: "HostGator",
    hostinger: "Hostinger",
    siteground: "SiteGround",
    network_solutions: "Network Solutions",
    route53: "AWS Route 53",
    google_domains: "Google Domains",
    squarespace: "Squarespace",
    wix: "Wix",
    shopify: "Shopify",
    dreamhost: "DreamHost",
    porkbun: "Porkbun",
    unknown: "Other Provider",
  };
  return map[id] ?? id;
}
