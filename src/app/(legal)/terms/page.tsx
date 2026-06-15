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
      <p className="text-[15px] text-gray-500">
        <strong>Last Updated:</strong> July 1, 2026
      </p>

      <div className="mt-6 mb-10">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to
          and use of the Next Surplus platform at nextsurplus.com (the
          &quot;Service&quot;), operated by Next Surplus (&quot;Next
          Surplus,&quot; &quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;). By creating an account or using the Service,
          you agree to be bound by these Terms.
        </p>
      </div>

      <Section title="1. The Service">
        <p>
          Next Surplus is a cloud based operations platform for surplus funds
          recovery firms. The Service provides lead management, case
          tracking, physical mail sending, email integration, document
          management, and related tools.
        </p>
        <p>
          The Service is intended for use by businesses engaged in lawful
          surplus funds recovery operations. The Service is not intended for
          consumer use.
        </p>
      </Section>

      <Section title="2. Accounts and Access">
        <Sub title="2.1 Eligibility">
          <p>
            You must be at least 18 years old and authorized to act on behalf
            of a legally formed business entity to use the Service. By
            creating an account, you represent that you meet these
            requirements.
          </p>
        </Sub>
        <Sub title="2.2 Account Registration">
          <p>
            When you create an account, you create an organization
            (&quot;Organization&quot;) within the Service. The person who
            creates the Organization is the initial administrator. You are
            responsible for maintaining the accuracy of your account
            information and the security of your login credentials.
          </p>
        </Sub>
        <Sub title="2.3 Team Access">
          <p>
            Organization administrators may invite additional users to their
            Organization. Each invited user must create their own account.
            The Organization administrator is responsible for managing team
            member access and permissions.
          </p>
        </Sub>
        <Sub title="2.4 Account Security">
          <p>
            You are responsible for all activity that occurs under your
            account. You must immediately notify us at{" "}
            <a href="mailto:support@nextsurplus.com">
              support@nextsurplus.com
            </a>{" "}
            if you become aware of any unauthorized access to your account.
          </p>
        </Sub>
      </Section>

      <Section title="3. Subscription and Billing">
        <Sub title="3.1 Pricing">
          <p>
            The Service is offered at a flat rate of $69 per month per
            Organization, billed monthly. This includes unlimited users
            within the Organization. Pricing is subject to change with 30
            days written notice to active subscribers.
          </p>
        </Sub>
        <Sub title="3.2 Payment Processing">
          <p>
            Payments are processed by Stripe, Inc. By subscribing, you agree
            to Stripe&apos;s terms of service. You authorize us to charge
            your payment method on file for the monthly subscription fee and
            any applicable metered usage charges.
          </p>
        </Sub>
        <Sub title="3.3 Metered Billing for Physical Mail">
          <p>
            Physical mail sent through the Service (letters and checks) is
            billed as metered usage at cost plus a 20% service fee. Metered
            charges accumulate during each billing period and appear as a
            separate line item on your monthly invoice. You can view your
            metered charges in the Stripe Customer Portal.
          </p>
        </Sub>
        <Sub title="3.4 Failed Payments">
          <p>
            If a payment fails, we will attempt to charge your payment method
            up to three additional times over seven days. During this seven
            day grace period, you retain full access to the Service. After
            seven days of failed payment, your account enters a restricted
            state where you may view your data but cannot perform write
            actions (editing leads, sending mail, importing data). To
            restore full access, update your payment method through the
            Stripe Customer Portal.
          </p>
        </Sub>
        <Sub title="3.5 Cancellation">
          <p>
            You may cancel your subscription at any time through the Stripe
            Customer Portal accessible from Settings &gt; Billing in the
            Service. Upon cancellation:
          </p>
          <ul>
            <li>
              Your subscription remains active until the end of the current
              billing period
            </li>
            <li>
              After the billing period ends, your account enters read only
              mode for 30 days
            </li>
            <li>
              After 30 days of read only access, your account and all
              associated data are deleted unless you resubscribe
            </li>
          </ul>
          <p>We do not offer prorated refunds for partial months.</p>
        </Sub>
        <Sub title="3.6 Price Changes">
          <p>
            We may change pricing with at least 30 days notice via email to
            the account administrator. Price changes take effect at the
            start of the next billing cycle following the notice period. If
            you do not agree to a price change, you may cancel before it
            takes effect.
          </p>
        </Sub>
      </Section>

      <Section title="4. Your Data">
        <Sub title="4.1 Ownership">
          <p>
            You retain full ownership of all data you enter into the Service
            (&quot;Your Data&quot;), including lead records, case notes,
            documents, templates, and email content. We claim no ownership
            rights over Your Data.
          </p>
        </Sub>
        <Sub title="4.2 License to Operate">
          <p>
            By using the Service, you grant us a limited, non exclusive
            license to store, process, display, and transmit Your Data
            solely to provide the Service to you. This license terminates
            when you delete your account.
          </p>
        </Sub>
        <Sub title="4.3 Data Portability">
          <p>
            You may export Your Data at any time using the export features
            within the Service. We will not hold your data hostage if you
            choose to leave.
          </p>
        </Sub>
        <Sub title="4.4 Data Isolation">
          <p>
            The Service uses a multi tenant architecture with row level
            security. Your Data is logically isolated from other
            Organizations. No other Organization can access Your Data
            through the Service.
          </p>
        </Sub>
        <Sub title="4.5 Backups">
          <p>
            We maintain regular backups of the Service database. Backups are
            encrypted and retained for disaster recovery purposes. We do not
            guarantee restoration of individual records from backups.
          </p>
        </Sub>
      </Section>

      <Section title="5. Acceptable Use">
        <p>
          You agree to use the Service only for lawful purposes and in
          accordance with these Terms. You agree not to:
        </p>
        <ul>
          <li>
            Use the Service for any activity that violates federal, state, or
            local law, including but not limited to consumer protection
            laws, telemarketing regulations, and fair debt collection
            practices
          </li>
          <li>Upload or transmit malicious code, viruses, or harmful data</li>
          <li>
            Attempt to access another Organization&apos;s data or another
            user&apos;s account
          </li>
          <li>
            Circumvent or interfere with the Service&apos;s security
            features, including row level security policies
          </li>
          <li>
            Use the Service to send unsolicited bulk mail or spam through the
            physical mail or email features
          </li>
          <li>
            Reverse engineer, decompile, or disassemble any portion of the
            Service
          </li>
          <li>
            Resell, sublicense, or redistribute access to the Service without
            our written permission
          </li>
          <li>Use the Service to harass, threaten, or defraud any person</li>
          <li>
            Misrepresent your identity or the nature of your business when
            using the Service
          </li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these terms. For material violations, we will provide notice and an
          opportunity to cure before termination, except where immediate
          suspension is necessary to prevent harm or comply with law.
        </p>
      </Section>

      <Section title="6. Physical Mail">
        <Sub title="6.1 Your Responsibility">
          <p>
            When you send physical mail (letters or checks) through the
            Service, you are the sender. We provide the technology platform;
            you are responsible for the content, accuracy, and legal
            compliance of every piece of mail you send.
          </p>
        </Sub>
        <Sub title="6.2 Check Sending">
          <p>
            Checks sent through the Service are drawn from your verified bank
            account. You are responsible for ensuring sufficient funds are
            available. Next Surplus is not liable for bounced checks,
            incorrect amounts, or mailing to wrong addresses. You bear all
            risk of loss related to checks you send.
          </p>
        </Sub>
        <Sub title="6.3 USPS Compliance">
          <p>
            All mail sent through the Service is delivered via USPS. You are
            responsible for complying with all applicable USPS regulations,
            including address formatting and prohibited content rules.
          </p>
        </Sub>
      </Section>

      <Section title="7. Email (Gmail Integration)">
        <Sub title="7.1 Google Account Connection">
          <p>
            The Service allows you to connect your Google Gmail account to
            sync and send email. Connecting your Gmail account is optional.
            When you connect, you authorize us to access your Gmail account
            through Google&apos;s OAuth system with the permissions described
            in our Privacy Policy.
          </p>
        </Sub>
        <Sub title="7.2 Your Responsibility">
          <p>
            Emails you send through the Service are sent from your Gmail
            account. You are the sender and are responsible for the content
            and legal compliance of all emails you send, including CAN SPAM
            Act compliance.
          </p>
        </Sub>
        <Sub title="7.3 Disconnecting">
          <p>
            You may disconnect your Gmail account at any time through
            Settings. Disconnecting stops email syncing and deletes cached
            email data from the Service.
          </p>
        </Sub>
      </Section>

      <Section title="8. Intellectual Property">
        <Sub title="8.1 Our Property">
          <p>
            The Service, including its design, code, features, documentation,
            and branding, is owned by Next Surplus and protected by
            intellectual property laws. These Terms do not grant you any
            rights to our intellectual property except the limited right to
            use the Service as a subscriber.
          </p>
        </Sub>
        <Sub title="8.2 Feedback">
          <p>
            If you provide suggestions, ideas, or feedback about the Service,
            you grant us a perpetual, irrevocable, non exclusive license to
            use that feedback for any purpose without compensation.
          </p>
        </Sub>
      </Section>

      <Section title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
          IMPLIED, OR STATUTORY. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Service will be uninterrupted, error
          free, or free of harmful components. We do not warrant the
          accuracy, reliability, or completeness of any information provided
          through the Service.
        </p>
        <p>
          The Service is a business tool, not a legal or financial advisory
          service. We do not provide legal, financial, or tax advice. You are
          solely responsible for ensuring your use of the Service complies
          with applicable laws and regulations governing surplus funds
          recovery in your jurisdiction.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXT SURPLUS
          SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
          REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF
          THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY.
        </p>
        <p>
          OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE
          SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12)
          MONTHS PRECEDING THE CLAIM.
        </p>
        <p>
          These limitations apply even if we have been advised of the
          possibility of such damages and even if a remedy fails its
          essential purpose.
        </p>
      </Section>

      <Section title="11. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Next Surplus,
          its officers, directors, employees, and agents from any claims,
          damages, losses, liabilities, and expenses (including reasonable
          attorneys&apos; fees) arising from:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any law or regulation</li>
          <li>
            The content of mail or email you send through the Service
          </li>
          <li>
            Any dispute between you and a property owner, county, or other
            party related to surplus funds recovery
          </li>
        </ul>
      </Section>

      <Section title="12. Modifications to the Service">
        <p>
          We may modify, update, or discontinue features of the Service at
          any time. For material changes that reduce functionality you are
          currently using, we will provide at least 30 days notice. We are
          not liable for any modification, suspension, or discontinuation of
          the Service.
        </p>
      </Section>

      <Section title="13. Modifications to These Terms">
        <p>
          We may update these Terms from time to time. We will notify you of
          material changes via email to the account administrator at least
          30 days before the changes take effect. Your continued use of the
          Service after changes take effect constitutes acceptance. If you do
          not agree to updated Terms, you may cancel your subscription.
        </p>
      </Section>

      <Section title="14. Termination">
        <Sub title="14.1 By You">
          <p>
            You may terminate your account at any time by cancelling your
            subscription and requesting account deletion at{" "}
            <a href="mailto:support@nextsurplus.com">
              support@nextsurplus.com
            </a>
            .
          </p>
        </Sub>
        <Sub title="14.2 By Us">
          <p>
            We may suspend or terminate your account if you violate these
            Terms, fail to pay subscription fees after the grace period, or
            if we are required to do so by law. Except for violations
            requiring immediate action, we will provide 14 days notice
            before termination and an opportunity to export your data.
          </p>
        </Sub>
        <Sub title="14.3 Effect of Termination">
          <p>
            Upon termination, your right to use the Service ceases
            immediately (or at end of billing period for cancellations). We
            will retain your data for 30 days to allow for export, after
            which it is permanently deleted per our Privacy Policy.
          </p>
        </Sub>
      </Section>

      <Section title="15. Governing Law and Disputes">
        <p>
          These Terms are governed by the laws of the State of South Carolina
          without regard to conflict of law principles. Any disputes arising
          from these Terms or your use of the Service shall be resolved in
          the state or federal courts located in South Carolina. You consent
          to personal jurisdiction in those courts.
        </p>
      </Section>

      <Section title="16. General">
        <ul>
          <li>
            <strong>Entire Agreement.</strong> These Terms, together with our
            Privacy Policy, constitute the entire agreement between you and
            Next Surplus regarding the Service.
          </li>
          <li>
            <strong>Severability.</strong> If any provision of these Terms is
            found unenforceable, the remaining provisions remain in full
            effect.
          </li>
          <li>
            <strong>Waiver.</strong> Our failure to enforce any provision
            does not constitute a waiver of that provision.
          </li>
          <li>
            <strong>Assignment.</strong> You may not assign your rights under
            these Terms. We may assign our rights in connection with a
            merger, acquisition, or sale of assets with notice to you.
          </li>
          <li>
            <strong>Force Majeure.</strong> We are not liable for failures or
            delays caused by events beyond our reasonable control, including
            natural disasters, internet outages, or government actions.
          </li>
        </ul>
      </Section>

      <Section title="17. Contact Us">
        <p>If you have questions about these Terms:</p>
        <p>
          <strong>Next Surplus</strong>
          <br />
          Email:{" "}
          <a href="mailto:support@nextsurplus.com">support@nextsurplus.com</a>
          <br />
          Website:{" "}
          <a href="https://nextsurplus.com">https://nextsurplus.com</a>
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

function Sub({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mt-7 mb-3 text-[17px] font-semibold text-[#13644e]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
