// Per-org generated privacy policy.
//
// Each customer org gets a hosted privacy policy at /legal/{org_slug}/privacy.
// We pull company name, address, contact email, and website from the orgs
// table. The customer puts THIS URL into A2P 10DLC brand registration and
// any "Privacy Policy" footer link in their outbound communications.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }): Promise<Metadata> {
  const { orgSlug } = await params;
  const org = await loadOrg(orgSlug);
  return {
    title: `Privacy Policy · ${org?.name ?? "Next Surplus Customer"}`,
    robots: { index: true, follow: false },
  };
}

type OrgSummary = {
  name: string;
  legal_name: string | null;
  website: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
};

async function loadOrg(slug: string): Promise<OrgSummary | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("orgs")
    .select("name, legal_name, website, email, address_line1, city, region, postal_code, country")
    .eq("id", slug)
    .maybeSingle();
  return (data as OrgSummary | null) ?? null;
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await loadOrg(orgSlug);
  if (!org) notFound();

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const companyName = org.legal_name ?? org.name;
  const address = [org.address_line1, org.city, org.region, org.postal_code, org.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto max-w-[760px] px-8 py-16 text-[#0a0d14]" style={{ fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.6 }}>
      <div className="text-[12px] uppercase tracking-[0.14em] text-[#9298a3]">Privacy Policy</div>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.018em]">{companyName}</h1>
      <p className="mt-1 text-[13px] text-[#5b606a]">Effective {today}</p>

      <Section title="Who We Are">
        <p>
          {companyName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a service that helps recover surplus funds for individuals who may be entitled to them. This Privacy Policy explains what information we collect, how we use it, and the choices you have. {org.website && <>Our website is <a href={org.website} className="text-[#0d4b3a]">{org.website}</a>.</>}
        </p>
      </Section>

      <Section title="What We Collect">
        <ul className="list-disc pl-6">
          <li>Public-record information about properties, judgments, and parties (name, address, court-listed contact)</li>
          <li>Contact details you give us when you reply to outreach (email, phone, mailing address)</li>
          <li>Documents you upload to support a claim (ID, signed retainer, supporting affidavits)</li>
          <li>Communication content (calls, voicemails, SMS, emails between you and our team)</li>
        </ul>
      </Section>

      <Section title="How We Use It">
        <ul className="list-disc pl-6">
          <li>Identify and contact parties who may be entitled to surplus funds</li>
          <li>Verify identity, prepare claim paperwork, and file with the court or trustee</li>
          <li>Respond to your messages and provide customer support</li>
          <li>Comply with legal obligations and respond to lawful requests</li>
        </ul>
      </Section>

      <Section title="SMS Messaging Consent">
        <p>
          If you receive an SMS from us, you may reply <strong>STOP</strong> at any time to opt out of future text messages. Reply <strong>HELP</strong> for assistance. Message and data rates may apply. Frequency varies and depends on the active claim.
        </p>
      </Section>

      <Section title="Who We Share With">
        <p>
          We share information only when needed to deliver our service or comply with the law:
        </p>
        <ul className="list-disc pl-6">
          <li>Attorneys or trustees handling your claim</li>
          <li>Courts, government agencies, and counterparties when required</li>
          <li>Payment processors and document delivery vendors (under written contract)</li>
          <li>Telecommunications carriers when sending you SMS or making calls</li>
        </ul>
        <p>We do not sell personal information.</p>
      </Section>

      <Section title="Your Choices">
        <ul className="list-disc pl-6">
          <li>Opt out of SMS at any time by replying STOP</li>
          <li>Ask us to delete your data by contacting us at the email below</li>
          <li>Request a copy of the information we hold about you</li>
        </ul>
      </Section>

      <Section title="Contact Us">
        <p>
          {companyName}
          {address ? <><br />{address}</> : null}
          {org.email ? <><br />Email: <a href={`mailto:${org.email}`} className="text-[#0d4b3a]">{org.email}</a></> : null}
        </p>
      </Section>

      <p className="mt-10 border-t border-[#ebedf0] pt-6 text-[11.5px] text-[#9298a3]">
        This policy is generated by Next Surplus for {companyName} based on information they provided. Last updated {today}.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[18px] font-semibold tracking-[-0.014em]">{title}</h2>
      <div className="mt-3 text-[14px] text-[#0a0d14]">{children}</div>
    </section>
  );
}
