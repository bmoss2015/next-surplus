import {
  Card,
  FakeSelect,
  StartSessionCTA,
  BackButton,
  SectionLabel,
} from "./Shared";

type Outcome = {
  name: string;
  bar: "petrol" | "gray" | "red";
  template: string;
  description: string;
};

const OUTCOMES: Outcome[] = [
  {
    name: "Interested",
    bar: "petrol",
    template: "Documentation Packet",
    description:
      "Sends the firm letterhead intro packet plus a one-page summary of the recovery process.",
  },
  {
    name: "Callback Requested",
    bar: "petrol",
    template: "Callback Confirmation",
    description:
      "Confirms the agreed callback window and shares the dialer's direct number.",
  },
  {
    name: "Not Interested",
    bar: "gray",
    template: "Light Touch Follow Up",
    description:
      "Polite single paragraph staying in touch. Triggers a 60 day cool down before the next outreach.",
  },
  {
    name: "Wrong Number",
    bar: "gray",
    template: "None",
    description:
      "No email sent. Lead is flagged for contact tree review so the next dial routes to a different number.",
  },
  {
    name: "Do Not Contact",
    bar: "red",
    template: "Verification Required",
    description:
      "Two line confirmation that the request is recorded. Lead moves to the suppression list immediately.",
  },
];

const BAR_CLASS: Record<Outcome["bar"], string> = {
  petrol: "bg-petrol-700",
  gray: "bg-gray-300",
  red: "bg-[#b91c1c]",
};

export function Step3() {
  return (
    <div>
      <Card>
        <SectionLabel icon="mail">Auto Follow Up</SectionLabel>
        <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">
          For each call outcome, pick the email template that auto sends to the
          contact. The send is queued with a 5 second undo window when the
          outcome is logged.
        </p>
        <div className="mt-5 space-y-3">
          {OUTCOMES.map((o) => (
            <div
              key={o.name}
              className="flex items-start gap-4 rounded-[12px] bg-[#FAFAFA] p-4"
            >
              <div className={`mt-1 h-12 w-1 rounded-full ${BAR_CLASS[o.bar]}`} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold tracking-tight text-ink">
                      {o.name}
                    </div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-gray-600">
                      {o.description}
                    </div>
                  </div>
                  <div className="flex w-[260px] shrink-0 flex-col items-end gap-1.5">
                    <FakeSelect value={o.template} />
                    <a
                      href="#"
                      className="cursor-pointer text-[10.5px] font-semibold text-petrol-700 hover:underline"
                    >
                      Preview Template →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <a
            href="#"
            className="cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
          >
            Manage Email Templates →
          </a>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <BackButton />
        <StartSessionCTA subLabel="47 Leads" />
      </div>
    </div>
  );
}
