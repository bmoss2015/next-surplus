import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Next Surplus",
  description:
    "Terms governing your access to and use of Next Surplus at nextsurplus.com.",
};

export default function TermsPage() {
  return (
    <article className="prose-legal">
      <h1 className="mb-2 text-[32px] font-bold text-[#0d4b3a]">
        Terms of Service
      </h1>
      <p className="text-[15px] text-gray-500">
        <strong>Next Surplus</strong>
      </p>
      <p className="text-[15px] text-gray-500">
        <strong>Effective Date:</strong> July 1, 2026
      </p>

      <div className="mt-6 mb-10">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to
          and use of Next Surplus at nextsurplus.com (the
          &quot;Service&quot;). By creating an account or using the
          Service, you agree to be bound by these Terms.
        </p>
      </div>

      <Section title="1. The Service">
        <p>
          Next Surplus is a cloud platform for surplus funds recovery
          firms. The Service provides lead management, case tracking,
          physical mail sending, email integration, and related tools.
          The Service is intended for business use only.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          You must be at least 18 years old and authorized to act on
          behalf of a business entity to use the Service. When you create
          an account, you are responsible for the security of your login
          credentials and for all activity under your account. Notify us
          at{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>{" "}
          immediately if you become aware of any unauthorized access.
        </p>
        <p>
          Organization administrators may invite team members. Each
          invited user creates their own account. The administrator is
          responsible for managing access and permissions within the
          organization.
        </p>
      </Section>

      <Section title="3. Subscription and Billing">
        <p>
          The Service is offered on a subscription basis at the
          then-current rates listed on our pricing page. By subscribing,
          you authorize us to charge your payment method on file for
          subscription fees and any applicable usage-based charges.
          Payments are processed by Stripe, Inc., subject to Stripe&apos;s
          terms of service.
        </p>
        <p>
          Physical mail sent through the Service is billed as usage at
          rates disclosed on your invoice. You may view current and past
          invoices through the customer billing portal accessible from
          within the Service.
        </p>
        <p>
          If a payment fails, we will retry the charge per Stripe&apos;s
          standard schedule. If payment remains unsuccessful after the
          retry period, your account may be restricted until you update
          your payment method. You may cancel your subscription at any
          time from the billing portal; cancellation takes effect at the
          end of your current billing period and we do not offer prorated
          refunds for partial periods.
        </p>
        <p>
          We may change pricing with at least 30 days&apos; notice via
          email to the account administrator. Price changes take effect
          on the next billing cycle following the notice period. If you
          do not agree to a change, you may cancel before it takes
          effect.
        </p>
      </Section>

      <Section title="4. Your Data">
        <p>
          You retain full ownership of all data you enter into the
          Service. We claim no rights over your data. By using the
          Service, you grant us a limited, non-exclusive license to
          store, process, display, and transmit your data solely to
          provide the Service to you. This license terminates when you
          delete your account.
        </p>
        <p>
          You may export your data at any time using the export features
          within the Service. Each organization&apos;s data is isolated
          from other organizations. We maintain regular encrypted
          backups for disaster recovery; we do not guarantee restoration
          of individual records from backup.
        </p>
      </Section>

      <Section title="5. Acceptable Use">
        <p>
          You agree to use the Service only for lawful purposes. You
          agree not to:
        </p>
        <ul>
          <li>
            Use the Service for any activity that violates law, including
            consumer protection laws, telemarketing regulations, or fair
            debt collection practices
          </li>
          <li>Upload malicious code, viruses, or harmful data</li>
          <li>
            Attempt to access another organization&apos;s data or
            another user&apos;s account
          </li>
          <li>
            Circumvent or interfere with the Service&apos;s security
            features
          </li>
          <li>
            Send unsolicited bulk mail or spam through the physical mail
            or email features
          </li>
          <li>
            Reverse engineer, decompile, or disassemble any portion of
            the Service
          </li>
          <li>
            Resell, sublicense, or redistribute access to the Service
            without our written permission
          </li>
          <li>Use the Service to harass, threaten, or defraud anyone</li>
          <li>
            Misrepresent your identity or the nature of your business
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these terms.
          For material violations, we will provide notice and an
          opportunity to cure before termination, except where immediate
          suspension is necessary to prevent harm or comply with law.
        </p>
      </Section>

      <Section title="6. Physical Mail">
        <p>
          When you send physical mail through the Service, you are the
          sender. You are responsible for the content, accuracy, and
          legal compliance of every piece you send. Checks sent through
          the Service are drawn from your verified bank account; you are
          responsible for ensuring sufficient funds and for any loss
          related to bounced checks, incorrect amounts, or incorrect
          addresses. All mail is delivered via USPS; you are responsible
          for complying with applicable USPS regulations.
        </p>
      </Section>

      <Section title="7. Email Integrations">
        <p>
          The Service can connect to your existing email inbox (such as
          Gmail, Outlook, or any IMAP-compatible provider) to sync
          messages and send on your behalf. Connecting an inbox is
          optional. When you connect, you authorize us to access that
          inbox with the permissions described in our Privacy Policy.
        </p>
        <p>
          Emails you send through the Service are sent from your inbox.
          You are the sender and are responsible for the content and
          legal compliance of every email, including CAN-SPAM
          compliance. You may disconnect any connected inbox at any time
          from Settings.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>
          The Service, including its design, code, features, and
          branding, is owned by Next Surplus and protected by
          intellectual property laws. These Terms do not grant you any
          rights to our intellectual property except the limited right
          to use the Service as a subscriber. Feedback you provide
          about the Service may be used by us for any purpose without
          compensation.
        </p>
      </Section>

      <Section title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS, IMPLIED, OR STATUTORY. WE DISCLAIM ALL WARRANTIES,
          INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant
          that the Service will be uninterrupted or error-free.
        </p>
        <p>
          The Service is a business tool, not a legal, financial, or tax
          advisory service. You are solely responsible for ensuring your
          use of the Service complies with laws and regulations
          governing surplus funds recovery in your jurisdiction.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXT SURPLUS SHALL NOT
          BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR
          USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p>
          OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE
          SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE
          (12) MONTHS PRECEDING THE CLAIM.
        </p>
      </Section>

      <Section title="11. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Next Surplus
          and its officers, directors, employees, and agents from any
          claims, damages, losses, liabilities, and expenses (including
          reasonable attorneys&apos; fees) arising from your use of the
          Service, your violation of these Terms or any law, the content
          of mail or email you send, or any dispute between you and a
          property owner, county, or other party.
        </p>
      </Section>

      <Section title="12. Modifications">
        <p>
          We may modify, update, or discontinue features of the Service
          at any time. We may update these Terms from time to time. For
          material changes, we will notify you via email to the account
          administrator. Your continued use of the Service after changes
          take effect constitutes acceptance. If you do not agree to
          updated Terms, you may cancel your subscription.
        </p>
      </Section>

      <Section title="13. Termination">
        <p>
          You may terminate your account at any time by cancelling your
          subscription from the billing portal and requesting account
          deletion at{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>
          . We may suspend or terminate your account if you violate
          these Terms, fail to pay subscription fees after the grace
          period, or if required by law. Upon termination, we will
          retain your data for a reasonable period to allow for export,
          after which it is permanently deleted as described in our
          Privacy Policy.
        </p>
      </Section>

      <Section title="14. Governing Law">
        <p>
          These Terms are governed by the laws of the State of South
          Carolina without regard to conflict of law principles. Any
          disputes arising from these Terms or your use of the Service
          shall be resolved in the state or federal courts located in
          South Carolina.
        </p>
      </Section>

      <Section title="15. General">
        <p>
          These Terms, together with our Privacy Policy, constitute the
          entire agreement between you and Next Surplus regarding the
          Service. If any provision is found unenforceable, the
          remaining provisions remain in full effect. Our failure to
          enforce any provision is not a waiver. You may not assign your
          rights under these Terms; we may assign our rights in
          connection with a merger, acquisition, or sale of assets. We
          are not liable for failures or delays caused by events beyond
          our reasonable control.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mt-12 mb-4 border-b border-gray-200 pb-2 text-[22px] font-semibold text-[#0d4b3a]">
        {title}
      </h2>
      <div className="space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1.5 [&_a]:text-[#13644e] [&_a:hover]:text-[#4a9c75]">
        {children}
      </div>
    </section>
  );
}
