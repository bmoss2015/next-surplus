import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Next Surplus",
  description:
    "How Next Surplus collects, uses, stores, and shares your information when you use our Service.",
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
      <p className="text-[15px] text-gray-500">
        <strong>Last Updated:</strong> July 1, 2026
      </p>

      <div className="mt-6 mb-10 space-y-4">
        <p>
          Workflow Minds LLC (&quot;Next Surplus,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) operates Next Surplus at
          app.nextsurplus.com (the &quot;Service&quot;). This Privacy Policy
          describes how we collect, use, store, and share your information
          when you use our Service.
        </p>
        <p>
          By using the Service, you agree to the collection and use of
          information as described in this policy. If you do not agree, do not
          use the Service.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <Sub title="1.1 Account Information">
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Name and email address</li>
            <li>Company name and mailing address</li>
            <li>Phone number (optional)</li>
            <li>Company logo (optional)</li>
            <li>Password (hashed, never stored in plain text)</li>
          </ul>
        </Sub>

        <Sub title="1.2 Payment Information">
          <p>
            When you subscribe to the Service, payment is processed by Stripe,
            Inc. We do not store your credit card number, CVV, or full card
            details on our servers. We receive and store your Stripe customer
            ID, subscription status, and billing history metadata. See
            Stripe&apos;s privacy policy at{" "}
            <a href="https://stripe.com/privacy">https://stripe.com/privacy</a>{" "}
            for details on how Stripe handles your payment data.
          </p>
        </Sub>

        <Sub title="1.3 Lead and Case Data">
          <p>
            You may enter or import data about property owners, surplus funds
            cases, and related records (&quot;Lead Data&quot;) into the
            Service. This data may include:
          </p>
          <ul>
            <li>
              Property owner names, mailing addresses, phone numbers, and
              email addresses
            </li>
            <li>
              Property addresses, parcel numbers, and county/state information
            </li>
            <li>
              Surplus fund amounts, recovery fee percentages, and claim
              details
            </li>
            <li>Case notes, activity logs, and stage history</li>
            <li>Documents uploaded to the Service</li>
          </ul>
          <p>
            Lead Data is your data. We process it solely to provide the
            Service to you. We do not sell, share, or use Lead Data for
            advertising or any purpose unrelated to providing the Service.
          </p>
        </Sub>

        <Sub title="1.4 Gmail Data (Via Google OAuth)">
          <p>
            If you connect your Gmail account, we request the following Google
            OAuth scopes:
          </p>
          <ul>
            <li>
              <strong>gmail.readonly</strong>, to sync and display your email
              inbox within the Service
            </li>
            <li>
              <strong>gmail.send</strong>, to send emails on your behalf from
              within the Service
            </li>
            <li>
              <strong>userinfo.email</strong> and{" "}
              <strong>userinfo.profile</strong>, to identify your Google
              account
            </li>
          </ul>
          <p>
            <strong>What we access:</strong> Email messages, subject lines,
            sender/recipient addresses, timestamps, and message bodies for
            emails synced to your inbox view within the Service.
          </p>
          <p>
            <strong>What we store:</strong> Email metadata and message content
            are cached in our database to enable inbox search and display.
            Emails are associated with your user account and your
            organization.
          </p>
          <p>
            <strong>What we do not do:</strong> We do not use your Gmail data
            for advertising, market research, or any purpose other than
            displaying and sending email within the Service. We do not share
            your Gmail data with third parties except as required to provide
            the Service (e.g., our database hosting provider).
          </p>
          <p>
            <strong>Google API Services User Data Policy Compliance:</strong>{" "}
            Our use and transfer of information received from Google APIs
            adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically:
          </p>
          <ul>
            <li>
              We only use Gmail data to provide and improve the email features
              of the Service
            </li>
            <li>
              We do not transfer Gmail data to third parties except as
              necessary to provide the Service, as required by law, or as
              part of a merger/acquisition with adequate data protections
            </li>
            <li>We do not use Gmail data for serving advertisements</li>
            <li>
              We do not allow humans to read your Gmail data unless you
              provide affirmative consent for specific messages, it is
              necessary for security purposes (e.g., investigating abuse), it
              is necessary to comply with applicable law, or our use is
              limited to internal operations and the data has been aggregated
              and anonymized
            </li>
          </ul>
        </Sub>

        <Sub title="1.5 Usage Data and Analytics">
          <p>
            We collect anonymized usage data through PostHog to understand
            how the Service is used. This includes:
          </p>
          <ul>
            <li>Pages visited and features used</li>
            <li>Session duration and frequency</li>
            <li>Browser type, device type, and screen resolution</li>
            <li>Referring URL</li>
          </ul>
          <p>
            We do not use this data to identify individual users or for
            advertising purposes.
          </p>
        </Sub>

        <Sub title="1.6 Error Monitoring">
          <p>
            We use Sentry for error monitoring. When an application error
            occurs, Sentry may capture:
          </p>
          <ul>
            <li>The error message and stack trace</li>
            <li>Browser and device information</li>
            <li>The URL where the error occurred</li>
          </ul>
          <p>
            Error data does not include your Lead Data, email content, or
            payment information.
          </p>
        </Sub>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use collected information to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Process your subscription payments</li>
          <li>
            Send transactional emails (account confirmations, password resets,
            billing receipts, system notifications)
          </li>
          <li>
            Display your synced Gmail inbox within the Service and send emails
            on your behalf
          </li>
          <li>Monitor for errors and improve reliability</li>
          <li>Respond to your support requests</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do not use your information for advertising, profiling, or
          automated decision making.
        </p>
      </Section>

      <Section title="3. How We Share Your Information">
        <p>
          We share your information only with the following categories of
          service providers, solely to operate the Service:
        </p>
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                <ProviderTh>Provider</ProviderTh>
                <ProviderTh>Purpose</ProviderTh>
                <ProviderTh>Data Shared</ProviderTh>
              </tr>
            </thead>
            <tbody>
              <ProviderRow
                provider="Supabase (database and authentication)"
                purpose="Data storage, user authentication"
                data="All account and Lead Data (encrypted in transit and at rest)"
              />
              <ProviderRow
                provider="Stripe (payments)"
                purpose="Subscription billing"
                data="Email, name, payment method (handled by Stripe directly)"
              />
              <ProviderRow
                provider="Resend (transactional email)"
                purpose="System notifications, invites"
                data="Recipient email addresses, email content"
              />
              <ProviderRow
                provider="Google (Gmail API)"
                purpose="Email sync and sending"
                data="OAuth tokens, email content sent through the Service"
              />
              <ProviderRow
                provider="Vercel (hosting)"
                purpose="Application hosting"
                data="Request logs (IP addresses, URLs)"
              />
              <ProviderRow
                provider="PostHog (analytics)"
                purpose="Usage analytics"
                data="Anonymized usage events"
              />
              <ProviderRow
                provider="Sentry (error monitoring)"
                purpose="Error tracking"
                data="Error messages, stack traces, browser info"
              />
            </tbody>
          </table>
        </div>
        <p>
          We do not sell your personal information to any third party. We do
          not share your information with advertising networks, data brokers,
          or information resellers.
        </p>
        <p>
          We may disclose your information if required by law, subpoena, court
          order, or government request, or if we believe disclosure is
          necessary to protect the rights, property, or safety of Next
          Surplus, our users, or the public.
        </p>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>
          Your data is stored in Supabase managed PostgreSQL databases hosted
          in the United States. We implement the following security measures:
        </p>
        <ul>
          <li>
            All data is encrypted in transit (TLS 1.2+) and at rest (AES 256)
          </li>
          <li>
            Row Level Security policies enforce tenant isolation, each
            organization can only access its own data
          </li>
          <li>Passwords are hashed using bcrypt</li>
          <li>
            Stripe webhook signatures are verified to prevent tampering
          </li>
          <li>
            API keys and secrets are stored as environment variables, never
            in source code
          </li>
        </ul>
        <p>
          No system is 100% secure. While we implement commercially reasonable
          security measures, we cannot guarantee absolute security. If you
          become aware of a security vulnerability, please contact us at{" "}
          <a href="mailto:support@nextsurplus.com">support@nextsurplus.com</a>.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <ul>
          <li>
            <strong>Account data:</strong> Retained for the duration of your
            subscription.
          </li>
          <li>
            <strong>Lead Data:</strong> Retained for the duration of your
            subscription. You may export Lead Data at any time using the
            export features within the Service.
          </li>
          <li>
            <strong>Gmail data:</strong> Cached email data is deleted when you
            disconnect your Gmail account.
          </li>
          <li>
            <strong>Payment records:</strong> Billing history is retained by
            Stripe per their retention policy. We retain billing metadata
            (subscription status, invoice references) for accounting purposes
            as required by law.
          </li>
          <li>
            <strong>Analytics data:</strong> Anonymized usage data may be
            retained indefinitely for product improvement.
          </li>
          <li>
            <strong>Error logs:</strong> Retained for 90 days, then
            automatically deleted.
          </li>
        </ul>
      </Section>

      <Section title="6. Your Rights">
        <Sub title="6.1 All Users">
          <p>You have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> your personal information by contacting
              us
            </li>
            <li>
              <strong>Correct</strong> inaccurate personal information through
              your account settings or by contacting us
            </li>
            <li>
              <strong>Export</strong> your Lead Data via CSV export within the
              Service
            </li>
            <li>
              <strong>Disconnect</strong> your Gmail account at any time
              through Settings, which stops syncing and deletes cached email
              data
            </li>
          </ul>
        </Sub>

        <Sub title="6.2 California Residents (CCPA/CPRA)">
          <p>
            If you are a California resident, you have additional rights
            under the California Consumer Privacy Act as amended by the
            California Privacy Rights Act:
          </p>
          <ul>
            <li>
              <strong>Right to Know:</strong> You may request the categories
              and specific pieces of personal information we have collected
              about you.
            </li>
            <li>
              <strong>Right to Delete:</strong> You may request deletion of
              your personal information, subject to certain exceptions.
            </li>
            <li>
              <strong>Right to Correct:</strong> You may request correction of
              inaccurate personal information.
            </li>
            <li>
              <strong>Right to Opt Out of Sale/Sharing:</strong> We do not
              sell or share your personal information for cross context
              behavioral advertising, so there is nothing to opt out of.
            </li>
            <li>
              <strong>Right to Non Discrimination:</strong> We will not
              discriminate against you for exercising your privacy rights.
            </li>
          </ul>
          <p>
            To exercise these rights, email us at{" "}
            <a href="mailto:support@nextsurplus.com">
              support@nextsurplus.com
            </a>
            . We will verify your identity and respond within 45 days.
          </p>
        </Sub>

        <Sub title="6.3 Google Account Data">
          <p>
            You may revoke the Service&apos;s access to your Google account at
            any time through your Google Account permissions page at{" "}
            <a href="https://myaccount.google.com/permissions">
              https://myaccount.google.com/permissions
            </a>
            . Revoking access will stop email syncing and disable email
            sending through the Service.
          </p>
        </Sub>
      </Section>

      <Section title="7. Multi Tenant Architecture">
        <p>
          The Service is a multi tenant platform. Each organization&apos;s
          data is logically isolated from other organizations using row level
          security policies in our database. No organization can view, access,
          or modify another organization&apos;s data through the Service.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          The Service is not directed to individuals under the age of 18. We
          do not knowingly collect personal information from children. If you
          believe we have collected information from a child, please contact
          us at{" "}
          <a href="mailto:support@nextsurplus.com">support@nextsurplus.com</a>{" "}
          and we will delete it promptly.
        </p>
      </Section>

      <Section title="9. Cookies and Tracking">
        <p>
          The Service uses essential cookies for authentication and session
          management. These cookies are necessary for the Service to function
          and cannot be disabled.
        </p>
        <p>
          If analytics are enabled (PostHog), we use a cookie consent banner
          to obtain your consent before placing analytics cookies. You may
          decline analytics cookies without affecting your use of the
          Service.
        </p>
        <p>
          We do not use advertising cookies, tracking pixels, or retargeting
          technologies.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by posting the updated policy on this page
          and updating the &quot;Last Updated&quot; date. For significant
          changes, we will notify you via email or an in app notification.
          Your continued use of the Service after changes take effect
          constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy or want to exercise
          your privacy rights:
        </p>
        <p>
          <strong>Workflow Minds LLC</strong>
          <br />
          Email:{" "}
          <a href="mailto:support@nextsurplus.com">support@nextsurplus.com</a>
          <br />
          Website:{" "}
          <a href="https://app.nextsurplus.com">https://app.nextsurplus.com</a>
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

function ProviderTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-300 bg-[#f0f7f8] px-3 py-2.5 text-left font-semibold text-[#0d4b3a]">
      {children}
    </th>
  );
}

function ProviderRow({
  provider,
  purpose,
  data,
}: {
  provider: string;
  purpose: string;
  data: string;
}) {
  return (
    <tr>
      <td className="border border-gray-300 px-3 py-2.5 align-top">
        {provider}
      </td>
      <td className="border border-gray-300 px-3 py-2.5 align-top">
        {purpose}
      </td>
      <td className="border border-gray-300 px-3 py-2.5 align-top">{data}</td>
    </tr>
  );
}
