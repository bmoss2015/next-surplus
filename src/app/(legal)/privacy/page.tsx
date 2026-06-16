import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Next Surplus",
  description:
    "How Next Surplus collects, uses, stores, and shares your information.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      <h1 className="mb-2 text-[32px] font-bold text-[#0d4b3a]">
        Privacy Policy
      </h1>
      <p className="text-[15px] text-gray-500">
        <strong>Next Surplus</strong>
      </p>
      <p className="text-[15px] text-gray-500">
        <strong>Effective Date:</strong> July 1, 2026
      </p>

      <div className="mt-6 mb-10 space-y-4">
        <p>
          Next Surplus (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;) operates the Next Surplus platform at
          nextsurplus.com. This Privacy Policy describes how we collect,
          use, store, and share information when you use our Service.
          By using the Service, you agree to this policy.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <Sub title="1.1 Account Information">
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Name and email address</li>
            <li>Company name and mailing address</li>
            <li>Phone number (optional)</li>
            <li>Password (hashed, never stored in plain text)</li>
          </ul>
        </Sub>

        <Sub title="1.2 Payment Information">
          <p>
            Subscription payments are processed by Stripe, Inc. We do
            not store your card number, CVV, or full payment details.
            We receive and store your Stripe customer ID, subscription
            status, and billing history metadata. See{" "}
            <a href="https://stripe.com/privacy">Stripe&apos;s privacy policy</a>{" "}
            for how Stripe handles payment data.
          </p>
        </Sub>

        <Sub title="1.3 Bank Account Information">
          <p>
            If you connect a bank account for check sending, we use
            Plaid, Inc. to verify the account. Plaid collects your bank
            login credentials directly through its secure interface; we
            never see them. We receive and store (encrypted at rest) a
            Plaid access token and account identifier, used solely to
            verify the account for check disbursement. We do not access
            your bank transaction history or balances. See{" "}
            <a href="https://plaid.com/legal/#end-user-privacy-policy">
              Plaid&apos;s privacy policy
            </a>
            .
          </p>
        </Sub>

        <Sub title="1.4 Lead and Case Data">
          <p>
            You may enter or import data about property owners and
            surplus funds cases (&quot;Lead Data&quot;). Lead Data is
            your data. We process it solely to provide the Service to
            you. We do not sell, share, or use Lead Data for advertising
            or any purpose unrelated to providing the Service.
          </p>
        </Sub>

        <Sub title="1.5 Gmail Data (Via Google OAuth)">
          <p>
            If you connect your Gmail account, we request the following
            Google OAuth scopes:
          </p>
          <ul>
            <li>
              <strong>gmail.readonly</strong>, to sync and display your
              email inbox within the Service
            </li>
            <li>
              <strong>gmail.send</strong>, to send emails on your behalf
              from within the Service
            </li>
            <li>
              <strong>userinfo.email</strong> and{" "}
              <strong>userinfo.profile</strong>, to identify your Google
              account
            </li>
          </ul>
          <p>
            <strong>Google API Services User Data Policy Compliance:</strong>{" "}
            Our use and transfer of information received from Google
            APIs adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We only use Gmail
            data to provide email features of the Service. We do not
            transfer Gmail data to third parties except as necessary to
            provide the Service, as required by law, or as part of a
            merger or acquisition with adequate data protections. We do
            not use Gmail data for advertising. We do not allow humans
            to read your Gmail data except with your affirmative
            consent, for security purposes (e.g., investigating abuse),
            to comply with law, or for internal operations where the
            data is aggregated and anonymized.
          </p>
        </Sub>

        <Sub title="1.6 Other Email Providers">
          <p>
            If you connect a Microsoft (Outlook) account or any IMAP
            mailbox, we apply equivalent handling: we use the
            credentials only to sync and send mail on your behalf, and
            we do not use mailbox contents for advertising or share them
            with third parties except as needed to operate the Service.
          </p>
        </Sub>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use collected information to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>
            Process subscription payments and usage-based billing for
            physical mail
          </li>
          <li>
            Send transactional emails (account confirmations, password
            resets, billing receipts, system notifications)
          </li>
          <li>
            Display your synced inbox and send email on your behalf
          </li>
          <li>Send physical mail (letters and checks) on your behalf</li>
          <li>Verify your bank account for check sending</li>
          <li>Respond to your support requests</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do not use your information for advertising, profiling, or
          automated decision-making.
        </p>
      </Section>

      <Section title="3. How We Share Your Information">
        <p>
          We share information only with the categories of service
          providers below, and only as needed to operate the Service:
        </p>
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                <Th>Provider</Th>
                <Th>Purpose</Th>
              </tr>
            </thead>
            <tbody>
              <Row p="Supabase" u="Database, authentication, file storage" />
              <Row p="Stripe" u="Subscription billing" />
              <Row p="Plaid" u="Bank account verification" />
              <Row p="Mail delivery partner" u="Letters and checks via USPS" />
              <Row p="Resend" u="Transactional email" />
              <Row p="Google" u="Gmail integration (if you connect)" />
              <Row p="Microsoft" u="Outlook integration (if you connect)" />
              <Row p="Vercel" u="Application hosting" />
            </tbody>
          </table>
        </div>
        <p>
          We do not sell your personal information to any third party.
          We do not share with advertising networks, data brokers, or
          information resellers. We may disclose your information if
          required by law, subpoena, or court order, or if necessary to
          protect the rights, property, or safety of Next Surplus, our
          users, or the public.
        </p>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>
          Your data is stored in encrypted form in the United States.
          All data is encrypted in transit (TLS 1.2+) and at rest. OAuth
          tokens and bank credentials are encrypted with
          application-level encryption. Passwords are hashed using
          bcrypt.
        </p>
        <p>
          No system is 100% secure. While we implement commercially
          reasonable security measures, we cannot guarantee absolute
          security. If you become aware of a security vulnerability,
          please contact us at{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>
          .
        </p>
      </Section>

      <Section title="5. Data Retention">
        <ul>
          <li>
            <strong>Account data:</strong> Retained for the duration of
            your subscription and for a reasonable period after
            cancellation, after which it is deleted.
          </li>
          <li>
            <strong>Lead Data:</strong> Retained for the duration of
            your subscription. Upon account deletion, permanently
            deleted within 30 days.
          </li>
          <li>
            <strong>Email data:</strong> Cached email content is deleted
            when you disconnect the inbox or delete your account.
          </li>
          <li>
            <strong>Payment records:</strong> Retained by Stripe per
            their policy. We retain billing metadata as required by
            applicable law.
          </li>
        </ul>
      </Section>

      <Section title="6. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> your personal information by
            contacting us
          </li>
          <li>
            <strong>Correct</strong> inaccurate information through your
            account settings or by contacting us
          </li>
          <li>
            <strong>Delete</strong> your account and personal data
          </li>
          <li>
            <strong>Export</strong> your Lead Data via CSV export within
            the Service
          </li>
          <li>
            <strong>Disconnect</strong> any connected inbox or bank
            account at any time through Settings
          </li>
        </ul>
        <p>
          <strong>California residents:</strong> Under the CCPA/CPRA you
          have additional rights to know, delete, correct, and opt out
          of sale or sharing. We do not sell or share your personal
          information for cross-context behavioral advertising. To
          exercise rights, email{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>
          . We will verify your identity and respond within 45 days.
        </p>
        <p>
          <strong>Google account data:</strong> You may revoke the
          Service&apos;s access to your Google account at any time at{" "}
          <a href="https://myaccount.google.com/permissions">
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </Section>

      <Section title="7. Account Deletion">
        <p>
          You may request account deletion by emailing{" "}
          <a href="mailto:support@nextsurplus.com">
            support@nextsurplus.com
          </a>
          . Upon a verified deletion request, your account,
          organization, and all associated Lead Data will be permanently
          deleted within 30 days. Connected inbox and bank integrations
          are revoked. Aggregated analytics and billing records required
          for legal compliance may be retained.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          The Service is not directed to individuals under 18. We do not
          knowingly collect personal information from children. If you
          believe we have collected information from a child, please
          contact us and we will delete it promptly.
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          The Service uses essential cookies for authentication and
          session management. We do not use advertising cookies,
          tracking pixels, or retargeting technologies.
        </p>
      </Section>

      <Section title="10. Changes">
        <p>
          We may update this Privacy Policy from time to time. We will
          post the updated policy on this page and update the Effective
          Date. For significant changes we will notify you via email or
          in-app notification. Your continued use of the Service after
          changes take effect constitutes acceptance.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about this Privacy Policy or to exercise your
          privacy rights:{" "}
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-300 bg-[#f0f7f8] px-3 py-2.5 text-left font-semibold text-[#0d4b3a]">
      {children}
    </th>
  );
}

function Row({ p, u }: { p: string; u: string }) {
  return (
    <tr>
      <td className="border border-gray-300 px-3 py-2.5 align-top">{p}</td>
      <td className="border border-gray-300 px-3 py-2.5 align-top">{u}</td>
    </tr>
  );
}
