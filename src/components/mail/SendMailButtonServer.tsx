import "server-only";
import {
  fetchMailTemplates,
  fetchMailBankAccounts,
  fetchOrgInfo,
} from "@/lib/settings/fetch";
import { SendMailButton, type SendMailButtonProps } from "./SendMailButton";

type Props = Omit<
  SendMailButtonProps,
  "templates" | "bankAccounts" | "mailReady" | "fromAddress"
>;

// Server wrapper that fetches the org's templates + verified bank accounts
// and forwards them to the client component. Saves every caller from
// touching the settings fetchers directly.
export async function SendMailButtonServer(props: Props) {
  const [templates, bankAccounts, org] = await Promise.all([
    fetchMailTemplates(),
    fetchMailBankAccounts(),
    fetchOrgInfo(),
  ]);
  const banks = bankAccounts.map((b) => ({
    id: b.id,
    label: [
      b.bank_name,
      b.account_holder_name,
      b.account_last_four ? `**** ${b.account_last_four}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    verified: b.status === "verified",
  }));
  // Mail-ready means the org has a complete return address. Matches the
  // same check the sendMail server action does — if any of these are
  // missing the API rejects the send. We surface it on the button so the
  // user knows to fix it before opening the modal.
  const mailReady = Boolean(
    org.address_line1 && org.city && org.region && org.postal_code
  );
  const fromAddress = {
    name: org.name || "",
    line1: org.address_line1 ?? "",
    line2: org.address_line2 ?? null,
    city: org.city ?? "",
    region: org.region ?? "",
    postal_code: org.postal_code ?? "",
  };
  return (
    <SendMailButton
      {...props}
      templates={templates}
      bankAccounts={banks}
      mailReady={mailReady}
      fromAddress={fromAddress}
    />
  );
}
