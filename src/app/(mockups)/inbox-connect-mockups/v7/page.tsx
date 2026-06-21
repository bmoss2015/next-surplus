"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV7() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[920px] space-y-10">
        <CostPanel />
        <SharedFlow />

        <ProviderSection
          name="Cloudflare"
          clicks={2}
          logo={<CloudflareLogo />}
          screens={[
            {
              label: "Click 1 · In Our Portal",
              child: <CloudflareConnectScreen />,
            },
            {
              label: "Click 2 · Cloudflare Auth Page",
              child: <CloudflareAuthScreen />,
            },
            {
              label: "Auto · Back In Our Portal",
              child: <SuccessScreen domain="mossequitypartners.com" />,
            },
          ]}
        />

        <ProviderSection
          name="Vercel"
          clicks={2}
          logo={<VercelLogo />}
          screens={[
            {
              label: "Click 1 · In Our Portal",
              child: <VercelConnectScreen />,
            },
            {
              label: "Click 2 · Vercel OAuth",
              child: <VercelAuthScreen />,
            },
            {
              label: "Auto · Back In Our Portal",
              child: <SuccessScreen domain="mossequitypartners.com" />,
            },
          ]}
        />

        <ProviderSection
          name="GoDaddy"
          clicks={3}
          logo={<GoDaddyLogo />}
          screens={[
            {
              label: "Click 1 · In Our Portal",
              child: <GoDaddyConnectScreen />,
            },
            {
              label: "Click 2 · GoDaddy Sign In",
              child: <GoDaddySignInScreen />,
            },
            {
              label: "Click 3 · GoDaddy Authorize",
              child: <GoDaddyAuthScreen />,
            },
          ]}
        />

        <ProviderSection
          name="Namecheap"
          clicks={4}
          logo={<NamecheapLogo />}
          screens={[
            {
              label: "Click 1 · In Our Portal",
              child: <NamecheapConnectScreen />,
            },
            {
              label: "Click 2-3 · On Namecheap",
              child: <NamecheapTokenScreen />,
            },
            {
              label: "Click 4 · Paste In Our Portal",
              child: <NamecheapPasteScreen />,
            },
          ]}
        />

        <ProviderSection
          name="Bluehost · Hostinger · HostGator"
          clicks={12}
          clicksNote="Newfold family. No public API. Copy paste fallback."
          logo={<NewfoldLogo />}
          screens={[
            {
              label: "Click 1 · We Detect Newfold",
              child: <NewfoldDetectScreen />,
            },
            {
              label: "Clicks 2-12 · Manual Record Entry",
              child: <ManualEntryScreen />,
            },
            {
              label: "Final · Verify",
              child: <ManualVerifyScreen />,
            },
          ]}
        />

        <ProviderSection
          name="Long Tail (Network Solutions, Squarespace, Wix, Self Hosted)"
          clicks={12}
          clicksNote="Anything not in our integrated list. Copy paste, same as above."
          logo={<OtherLogo />}
          screens={[
            {
              label: "Click 1 · We Detect Provider Name",
              child: <OtherDetectScreen />,
            },
            {
              label: "Clicks 2-12 · Manual Record Entry",
              child: <ManualEntryScreen />,
            },
            {
              label: "Final · Verify",
              child: <ManualVerifyScreen />,
            },
          ]}
        />

        <CoverageTable />
      </div>

      <VariantFooter prev="v6" next="v1" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[920px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V7 · Per Provider Flow Comparison
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Connect Domain Wizard, Per DNS Provider
      </h1>
      <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[#6b7280]">
        Same dedicated sending domain pattern GoHighLevel uses, broken out
        by DNS provider so you can see exactly how many clicks each takes.
        OAuth integrations stay free. Copy paste fallback covers everyone
        else. AWS SES cost panel at top.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[920px] items-center justify-between text-[12px]">
      <Link
        href={`/inbox-connect-mockups/${prev}`}
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        &larr; Previous Variant
      </Link>
      <Link
        href="/inbox-connect-mockups"
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        Back To Gallery
      </Link>
      <Link
        href={`/inbox-connect-mockups/${next}`}
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        Next Variant &rarr;
      </Link>
    </div>
  );
}

function CostPanel() {
  return (
    <section>
      <SectionHeader
        kicker="Cost Reality"
        title="AWS SES Cost By Volume"
        subtitle="$0.10 per 1,000 emails. No monthly fee. No domain limit. Compared against Resend Pro ($20/mo for 50K + 10 domains) and Resend Scale ($90/mo+ for 100K+)."
      />
      <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <table className="w-full text-[12.5px]">
          <thead className="border-b border-[#e5e7eb] bg-[#fafbfc] text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            <tr>
              <Th>Total Emails / Month</Th>
              <Th>AWS SES</Th>
              <Th>Resend Equivalent</Th>
              <Th>What This Looks Like For You</Th>
            </tr>
          </thead>
          <tbody>
            <CostRow
              vol="1,000"
              ses="$0.10"
              resend="Free"
              context="One beta user, light usage"
            />
            <CostRow
              vol="5,000"
              ses="$0.50"
              resend="Free (3K), Then $20"
              context="One heavy user OR 5 light users"
            />
            <CostRow
              vol="10,000"
              ses="$1.00"
              resend="$20 (Pro)"
              context="10 light users OR 3 medium users"
            />
            <CostRow
              vol="50,000"
              ses="$5.00"
              resend="$20 (Pro)"
              context="10 medium users (5K each)"
            />
            <CostRow
              vol="100,000"
              ses="$10.00"
              resend="$35 (Pro+)"
              context="20 medium users OR 10 heavy users"
            />
            <CostRow
              vol="250,000"
              ses="$25.00"
              resend="$200+ (Scale)"
              context="50 medium users (5K each)"
            />
            <CostRow
              vol="500,000"
              ses="$50.00"
              resend="$400+ (Scale)"
              context="100 medium users"
            />
            <CostRow
              vol="1,000,000"
              ses="$100.00"
              resend="$1,150 (Scale)"
              context="200 medium users OR 100 heavy users"
              last
            />
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-3 rounded-[6px] border border-[#e5e7eb] bg-white px-4 py-3 text-[11.5px] text-[#374151]">
        <span className="inline-block h-1.5 w-1.5 flex-shrink-0 self-center rounded-full bg-[#13644e]" />
        <div>
          <span className="font-medium text-[#04261c]">
            At Your $49/month Subscription:
          </span>{" "}
          A medium user (5,000 emails/month) costs you $0.50 on AWS SES.
          That&apos;s 1% of their subscription. Even 100 heavy users
          (10K each = 1M total) is $100/month total, spread across
          $4,900 in subscription revenue.
        </div>
      </div>
    </section>
  );
}

function CostRow({
  vol,
  ses,
  resend,
  context,
  last = false,
}: {
  vol: string;
  ses: string;
  resend: string;
  context: string;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-[#f0f1f3]"}>
      <Td>
        <span className="font-medium text-[#04261c]">{vol}</span>
      </Td>
      <Td>
        <span className="font-mono text-[12px] font-medium text-[#13644e]">
          {ses}
        </span>
      </Td>
      <Td>
        <span className="font-mono text-[12px] text-[#6b7280]">{resend}</span>
      </Td>
      <Td>
        <span className="text-[#374151]">{context}</span>
      </Td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function SharedFlow() {
  return (
    <section>
      <SectionHeader
        kicker="Shared Entry"
        title="Step 0 · Same For Every Provider"
        subtitle="User types their domain. We auto detect their DNS provider in the background via NS lookup, then route them into the right flow."
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PortalFrame title="Add Domain">
          <FieldLabel>Domain You Want To Send From</FieldLabel>
          <FakeInput value="mossequitypartners.com" />
          <p className="mt-1.5 text-[11px] text-[#9ca3af]">
            We&apos;ll add records to a subdomain so your existing email
            keeps working.
          </p>
          <PrimaryButton className="mt-5">Continue</PrimaryButton>
        </PortalFrame>
        <PortalFrame title="Add Domain">
          <FieldLabel>Domain You Want To Send From</FieldLabel>
          <FakeInputDone value="mossequitypartners.com" />
          <DetectedRow
            label="Detected Cloudflare DNS"
            detail="We can verify in one click."
          />
          <PrimaryButton className="mt-5">Connect Cloudflare</PrimaryButton>
        </PortalFrame>
      </div>
    </section>
  );
}

function ProviderSection({
  name,
  clicks,
  clicksNote,
  logo,
  screens,
}: {
  name: string;
  clicks: number;
  clicksNote?: string;
  logo: React.ReactNode;
  screens: { label: string; child: React.ReactNode }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white">
            {logo}
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.01em] text-[#04261c]">
              {name}
            </div>
            {clicksNote && (
              <div className="text-[11.5px] text-[#6b7280]">{clicksNote}</div>
            )}
          </div>
        </div>
        <ClickBadge clicks={clicks} />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {screens.map((s) => (
          <FlowStep key={s.label} label={s.label}>
            {s.child}
          </FlowStep>
        ))}
      </div>
    </section>
  );
}

function FlowStep({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      {children}
    </div>
  );
}

function ClickBadge({ clicks }: { clicks: number }) {
  const tone =
    clicks <= 2
      ? { bg: "bg-white", border: "border-[#13644e]", text: "text-[#13644e]" }
      : clicks <= 4
        ? { bg: "bg-white", border: "border-[#13644e]", text: "text-[#13644e]" }
        : {
            bg: "bg-white",
            border: "border-[#e5e7eb]",
            text: "text-[#04261c]",
          };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-medium ${tone.bg} ${tone.border} ${tone.text}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#13644e]" />
      {clicks} Clicks
    </span>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#13644e]">
        {kicker}
      </div>
      <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.015em] text-[#04261c]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[#6b7280]">
        {subtitle}
      </p>
    </div>
  );
}

function PortalFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-3">
        <div className="text-[12.5px] font-semibold tracking-[-0.005em] text-[#04261c]">
          {title}
        </div>
        <div className="text-[10px] text-[#9ca3af]">Next Surplus</div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function FakeInput({ value }: { value: string }) {
  return (
    <div className="mt-1.5 flex h-[36px] w-full items-center rounded-[5px] border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#04261c]">
      {value}
    </div>
  );
}

function FakeInputDone({ value }: { value: string }) {
  return (
    <div className="mt-1.5 flex h-[36px] w-full items-center gap-2 rounded-[5px] border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#04261c]">
      <span className="flex-1">{value}</span>
      <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-medium text-[#374151]">
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-[36px] w-full cursor-pointer items-center justify-center rounded-[5px] bg-[#13644e] text-[12.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] ${className}`}
    >
      {children}
    </button>
  );
}

function DetectedRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-[11.5px]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#13644e]" />
      <span className="font-medium text-[#04261c]">{label}</span>
      <span className="text-[#9ca3af]">·</span>
      <span className="text-[#6b7280]">{detail}</span>
    </div>
  );
}

function CloudflareConnectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="Cloudflare DNS" detail="One Click Verify" />
      <PrimaryButton className="mt-5">Connect Cloudflare</PrimaryButton>
    </PortalFrame>
  );
}

function CloudflareAuthScreen() {
  return (
    <ExternalFrame brand="Cloudflare" host="dash.cloudflare.com">
      <div className="text-[12.5px] font-semibold text-[#04261c]">
        Next Surplus Wants Access
      </div>
      <div className="mt-1 text-[11.5px] text-[#6b7280]">
        Read and edit DNS records for{" "}
        <span className="font-mono">mossequitypartners.com</span>.
      </div>
      <div className="mt-4 flex gap-2">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryCompact>Authorize</PrimaryCompact>
      </div>
    </ExternalFrame>
  );
}

function VercelConnectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="Vercel DNS" detail="One Click Verify" />
      <PrimaryButton className="mt-5">Connect Vercel</PrimaryButton>
    </PortalFrame>
  );
}

function VercelAuthScreen() {
  return (
    <ExternalFrame brand="Vercel" host="vercel.com">
      <div className="text-[12.5px] font-semibold text-[#04261c]">
        Install Next Surplus
      </div>
      <div className="mt-1 text-[11.5px] text-[#6b7280]">
        Allows DNS record management on the Workflow Minds team.
      </div>
      <div className="mt-4 flex gap-2">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryCompact>Install</PrimaryCompact>
      </div>
    </ExternalFrame>
  );
}

function GoDaddyConnectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="GoDaddy DNS" detail="Domain Connect" />
      <PrimaryButton className="mt-5">Connect GoDaddy</PrimaryButton>
    </PortalFrame>
  );
}

function GoDaddySignInScreen() {
  return (
    <ExternalFrame brand="GoDaddy" host="sso.godaddy.com">
      <div className="text-[12.5px] font-semibold text-[#04261c]">
        Sign In To GoDaddy
      </div>
      <div className="mt-2 space-y-2">
        <FakeInput value="bree@mossequity" />
        <FakeInput value="●●●●●●●●" />
      </div>
      <PrimaryCompact className="mt-3 w-full">Sign In</PrimaryCompact>
    </ExternalFrame>
  );
}

function GoDaddyAuthScreen() {
  return (
    <ExternalFrame brand="GoDaddy" host="dcc.godaddy.com">
      <div className="text-[12.5px] font-semibold text-[#04261c]">
        Allow Next Surplus
      </div>
      <div className="mt-1 text-[11.5px] text-[#6b7280]">
        Will add DNS records to{" "}
        <span className="font-mono">mossequitypartners.com</span>.
      </div>
      <div className="mt-4 flex gap-2">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryCompact>Allow</PrimaryCompact>
      </div>
    </ExternalFrame>
  );
}

function NamecheapConnectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="Namecheap DNS" detail="Requires API Key" />
      <p className="mt-2 text-[11px] leading-relaxed text-[#6b7280]">
        Namecheap doesn&apos;t support one click auth. Generate an API key
        in your Namecheap account, then paste below.
      </p>
      <PrimaryButton className="mt-5">Open Namecheap Settings</PrimaryButton>
    </PortalFrame>
  );
}

function NamecheapTokenScreen() {
  return (
    <ExternalFrame brand="Namecheap" host="ap.www.namecheap.com">
      <div className="text-[12.5px] font-semibold text-[#04261c]">
        Profile · Tools · API Access
      </div>
      <div className="mt-2 rounded-[5px] border border-[#e5e7eb] bg-[#fafbfc] px-2.5 py-2 text-[10.5px] text-[#374151]">
        <div className="font-mono">API Key</div>
        <div className="mt-1 font-mono text-[#04261c]">
          a1b2c3d4e5f6g7h8i9j0
        </div>
        <button
          type="button"
          className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[10px] font-medium text-[#13644e]"
        >
          Copy
        </button>
      </div>
    </ExternalFrame>
  );
}

function NamecheapPasteScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FieldLabel>Paste Your Namecheap API Key</FieldLabel>
      <FakeInput value="a1b2c3d4e5f6g7h8i9j0" />
      <p className="mt-2 text-[11px] text-[#9ca3af]">
        We&apos;ll write records and verify.
      </p>
      <PrimaryButton className="mt-5">Verify Domain</PrimaryButton>
    </PortalFrame>
  );
}

function NewfoldDetectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="Bluehost DNS" detail="Manual Records Required" />
      <p className="mt-2 text-[11px] leading-relaxed text-[#6b7280]">
        Bluehost doesn&apos;t support automatic record writing. You&apos;ll
        copy four records below and add them in your Bluehost dashboard.
      </p>
      <PrimaryButton className="mt-5">Show Me The Records</PrimaryButton>
    </PortalFrame>
  );
}

function ManualEntryScreen() {
  return (
    <PortalFrame title="Add These DNS Records">
      <div className="space-y-1.5 text-[10.5px]">
        <DnsRow type="TXT" host="send" value="v=spf1 include:..." />
        <DnsRow type="CNAME" host="resend._domain..." value="resend.com" />
        <DnsRow type="MX" host="send" value="feedback-smtp..." />
        <DnsRow type="TXT" host="_dmarc" value="v=DMARC1; p=none" />
      </div>
      <p className="mt-2.5 text-[10.5px] text-[#9ca3af]">
        Click each Copy. Paste into Bluehost DNS page. Save.
      </p>
    </PortalFrame>
  );
}

function ManualVerifyScreen() {
  return (
    <PortalFrame title="Verify Domain">
      <div className="rounded-[5px] border border-[#e5e7eb] bg-[#fafbfc] px-3 py-2.5 text-[11px] text-[#374151]">
        <div className="font-medium text-[#04261c]">Checking Records</div>
        <div className="mt-0.5 text-[#9ca3af]">
          DNS changes can take 5 to 60 minutes to propagate.
        </div>
      </div>
      <PrimaryButton className="mt-4">Verify Now</PrimaryButton>
    </PortalFrame>
  );
}

function OtherDetectScreen() {
  return (
    <PortalFrame title="Add Domain">
      <FakeInputDone value="mossequitypartners.com" />
      <DetectedRow label="Network Solutions" detail="Manual Setup" />
      <p className="mt-2 text-[11px] leading-relaxed text-[#6b7280]">
        We don&apos;t have a direct integration for this provider yet.
        You&apos;ll copy four records and add them at your DNS provider.
      </p>
      <PrimaryButton className="mt-5">Show Me The Records</PrimaryButton>
    </PortalFrame>
  );
}

function SuccessScreen({ domain }: { domain: string }) {
  return (
    <PortalFrame title="Domain Connected">
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />
        <span className="text-[13px] font-medium tracking-[-0.005em] text-[#04261c]">
          Verified
        </span>
      </div>
      <div className="mt-2 text-[12px] text-[#04261c]">{domain}</div>
      <div className="text-[11px] text-[#6b7280]">
        You Can Now Send Email From This Domain
      </div>
      <button
        type="button"
        className="mt-4 inline-flex h-[34px] w-full cursor-pointer items-center justify-center rounded-[5px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
      >
        Go To Inbox
      </button>
    </PortalFrame>
  );
}

function ExternalFrame({
  brand,
  host,
  children,
}: {
  brand: string;
  host: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-center gap-2 border-b border-[#f0f1f3] bg-[#fafbfc] px-4 py-3">
        <div className="flex gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#e5e7eb]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[#e5e7eb]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[#e5e7eb]" />
        </div>
        <div className="flex-1 truncate font-mono text-[10.5px] text-[#9ca3af]">
          {host}
        </div>
        <div className="text-[10px] font-medium text-[#04261c]">{brand}</div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-[30px] flex-1 cursor-pointer items-center justify-center rounded-[5px] border border-[#e5e7eb] bg-white text-[11.5px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
    >
      {children}
    </button>
  );
}

function PrimaryCompact({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-[30px] flex-1 cursor-pointer items-center justify-center rounded-[5px] bg-[#13644e] text-[11.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] ${className}`}
    >
      {children}
    </button>
  );
}

function DnsRow({
  type,
  host,
  value,
}: {
  type: string;
  host: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-[#e5e7eb] bg-white px-2 py-1.5 font-mono">
      <span className="rounded-[3px] bg-[#fafbfc] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#04261c]">
        {type}
      </span>
      <span className="truncate text-[#374151]">{host}</span>
      <span className="ml-auto truncate text-[#9ca3af]">{value}</span>
    </div>
  );
}

function CoverageTable() {
  return (
    <section>
      <SectionHeader
        kicker="Coverage Reality"
        title="Realistic One Click Coverage By DNS Provider Market Share"
        subtitle="Based on US small business hosting market. Wiring just Cloudflare + Vercel + GoDaddy + Namecheap covers about 55%. Adding Newfold (Bluehost, Hostinger, HostGator manual fallback) gets you to about 75%. The remaining 25% gets the same copy paste experience every other email service uses today."
      />
      <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <table className="w-full text-[12px]">
          <thead className="border-b border-[#e5e7eb] bg-[#fafbfc] text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            <tr>
              <Th>Provider</Th>
              <Th>Est. US Market Share</Th>
              <Th>Auth Method</Th>
              <Th>Click Count</Th>
            </tr>
          </thead>
          <tbody>
            <CovRow
              name="GoDaddy"
              share="25-30%"
              method="Domain Connect OAuth"
              clicks="3"
            />
            <CovRow
              name="Cloudflare"
              share="15-20%"
              method="API Token OAuth"
              clicks="2"
            />
            <CovRow
              name="Namecheap"
              share="10%"
              method="API Key Paste"
              clicks="4"
            />
            <CovRow
              name="Bluehost"
              share="5-10%"
              method="Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="Hostinger"
              share="5%"
              method="Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="HostGator"
              share="5%"
              method="Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="SiteGround"
              share="3%"
              method="Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="Network Solutions"
              share="3%"
              method="Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="Vercel"
              share="3%"
              method="OAuth"
              clicks="2"
            />
            <CovRow
              name="Squarespace / Wix / Shopify"
              share="5%"
              method="Limited API · Copy Paste"
              clicks="~12"
            />
            <CovRow
              name="Long Tail (Regional, Self Hosted)"
              share="10%"
              method="Copy Paste"
              clicks="~12"
              last
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CovRow({
  name,
  share,
  method,
  clicks,
  last = false,
}: {
  name: string;
  share: string;
  method: string;
  clicks: string;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-[#f0f1f3]"}>
      <Td>
        <span className="font-medium text-[#04261c]">{name}</span>
      </Td>
      <Td>
        <span className="text-[#374151]">{share}</span>
      </Td>
      <Td>
        <span className="text-[#6b7280]">{method}</span>
      </Td>
      <Td>
        <span className="font-mono text-[12px] font-medium text-[#04261c]">
          {clicks}
        </span>
      </Td>
    </tr>
  );
}

function CloudflareLogo() {
  return (
    <div className="text-[10.5px] font-bold tracking-[-0.02em] text-[#f38020]">
      CF
    </div>
  );
}

function VercelLogo() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#000" aria-hidden>
      <path d="M12 2L24 22H0L12 2z" />
    </svg>
  );
}

function GoDaddyLogo() {
  return (
    <div className="text-[10px] font-bold tracking-[-0.02em] text-[#0d6efd]">
      GD
    </div>
  );
}

function NamecheapLogo() {
  return (
    <div className="text-[10px] font-bold tracking-[-0.02em] text-[#d4202c]">
      NC
    </div>
  );
}

function NewfoldLogo() {
  return (
    <div className="text-[9.5px] font-bold tracking-[-0.02em] text-[#04261c]">
      NF
    </div>
  );
}

function OtherLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="#04261c"
      strokeWidth="1.6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  );
}
