import {
  Card,
  SectionLabel,
  Checkbox,
  Radio,
  FakeSelect,
  SingleSlider,
  ContinueButton,
  BackButton,
} from "./Shared";

export function Step2() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionLabel icon="phone">Dial From Number</SectionLabel>
          <div className="mt-3 space-y-1">
            <Radio
              label="Auto Map by State (Recommended)"
              selected
              trailing={
                <span className="rounded-md bg-petrol-100 px-1.5 py-0.5 text-[10px] font-semibold text-petrol-700">
                  Higher Answer Rates
                </span>
              }
            />
            <Radio label="Use a Specific Number" selected={false} />
            <div className="ml-7 mt-1">
              <FakeSelect value="(216) 555-9100 · OH" disabled />
            </div>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-gray-500">
            Auto Map picks a local number for each lead based on state. Falls back
            to the default when no local number is available.
          </div>
        </Card>

        <Card>
          <SectionLabel icon="shield">Compliance</SectionLabel>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <Checkbox label="Skip DNC Flagged Numbers" checked />
              <span className="text-[10.5px] text-gray-500">Recommended</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <Checkbox label="Skip Litigated Leads" checked />
              <span className="text-[10.5px] text-gray-500">
                8 leads currently excluded
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-gray-500">
            Both defaults ON for VA-run sessions. Toggle off only for a session
            you are running directly with documented consent.
          </div>
        </Card>

        <Card>
          <SectionLabel icon="clock">Wrap Up Time</SectionLabel>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[11px] text-gray-500">
              Time between call end and next dial
            </span>
            <span className="text-[22px] font-semibold tabular-nums text-ink">
              3<span className="ml-0.5 text-[12px] text-gray-500">s</span>
            </span>
          </div>
          <div className="mt-2.5">
            <SingleSlider at={30} />
            <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-gray-400">
              <span>0s (Immediate)</span>
              <span>10s</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-gray-500">
            Countdown is always skippable with the Dial Now button.
          </div>
        </Card>

        <Card>
          <SectionLabel icon="note">Note Handling</SectionLabel>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex-1">
              <Checkbox label="Pause Countdown If I'm Typing a Note" checked={false} />
              <div className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                Off by default (industry standard). When ON, the countdown
                pauses while the note field has unsaved text, preventing the
                next call from auto firing mid sentence. Trade off: a forgotten
                open note will stall the session.
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-2">
          <SectionLabel icon="voicemail">Voicemail Drop</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            <Radio label="Don't Drop Voicemails" selected={false} />
            <Radio label="Drop Voicemail When No Answer" selected />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Template
              </div>
              <div className="mt-1.5">
                <FakeSelect value="Standard Intro (16s)" />
              </div>
            </div>
            <div className="flex items-end">
              <a
                href="#"
                className="cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
              >
                Manage Templates →
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <BackButton />
        <ContinueButton label="Continue to Auto Follow Up" />
      </div>
    </div>
  );
}
