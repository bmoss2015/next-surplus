import {
  SetupCanvas,
  SetupHeader,
  FilterChip,
  Slider,
  CountyChips,
  StartSessionCTA,
  SectionIcon,
  ProgressDots,
  CASE_TYPES,
  CARD_SHADOW,
} from "./SetupShared";

export function SetupD() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option D · Conversational" />
      <div className="mx-auto flex max-w-[660px] flex-col px-7 pt-7">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Question 2 of 5
          </span>
          <ProgressDots total={5} current={2} />
        </div>

        <CompletedQuestion
          number={1}
          question="How many leads do you want to call?"
          answer="47 Leads"
        />

        <div className="mt-6">
          <ActiveQuestion
            number={2}
            question="What number should we dial from?"
            helper="Calls go out from this number. Auto Map switches per-state for higher answer rates."
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-white p-1.5 ring-1 ring-inset ring-gray-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-petrol-100 text-petrol-700">
                  <SectionIcon kind="phone" className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-ink">
                    (216) 555-9100
                  </div>
                  <div className="text-[10.5px] text-gray-500">OH · Cleveland local</div>
                </div>
                <span className="rounded-md bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold text-petrol-700">
                  Default
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-inset ring-gray-200 hover:bg-gray-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <SectionIcon kind="phone" className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-700">
                    (717) 555-2244
                  </div>
                  <div className="text-[10.5px] text-gray-500">PA · Lancaster local</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-petrol-700 px-3 py-2 text-white">
                <SectionIcon kind="check" className="h-3.5 w-3.5" />
                <span className="text-[12px] font-semibold">Auto Map by State</span>
                <span className="ml-auto text-[10.5px] text-white/65">Recommended</span>
              </div>
            </div>
          </ActiveQuestion>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 opacity-30">
          <UpcomingQuestion number={3} question="What happens after each call?" />
          <UpcomingQuestion number={4} question="Should we leave voicemails?" />
          <UpcomingQuestion number={5} question="Send follow up emails?" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <BackLink />
          <ContinueButton />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 ring-1 ring-inset ring-gray-200">
          <span className="text-[10.5px] text-gray-500">Press Enter to continue</span>
        </div>
      </div>
    </SetupCanvas>
  );
}

export function SetupDQuestion1() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option D · Conversational" />
      <div className="mx-auto flex max-w-[660px] flex-col px-7 pt-7">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Question 1 of 5
          </span>
          <ProgressDots total={5} current={1} />
        </div>

        <div className="mt-10">
          <ActiveQuestion
            number={1}
            question="How many leads do you want to call?"
            helper="Filter the list, then we will estimate how long the session takes."
          >
            <div className="space-y-3">
              <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-gray-200">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Case Type
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CASE_TYPES.map((c) => (
                    <FilterChip key={c.label} label={c.label} count={c.count} active={c.active} />
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-gray-200">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  County
                </div>
                <div className="mt-2">
                  <CountyChips />
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-gray-200">
                <div className="flex items-baseline justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Surplus Range
                  </div>
                  <div className="text-[11.5px] tabular-nums text-petrol-700 font-semibold">
                    $25K to $300K
                  </div>
                </div>
                <div className="mt-3">
                  <Slider start={20} end={85} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between rounded-lg bg-petrol-700 px-4 py-3 text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
                Matched
              </span>
              <div>
                <span className="text-[28px] font-semibold tabular-nums">47 Leads</span>
                <span className="ml-2 text-[12.5px] text-white/75">· Est. 4h 12m</span>
              </div>
            </div>
          </ActiveQuestion>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <ContinueButton />
        </div>
      </div>
    </SetupCanvas>
  );
}

function CompletedQuestion({
  number,
  question,
  answer,
}: {
  number: number;
  question: string;
  answer: string;
}) {
  return (
    <div className={`mt-7 flex items-center gap-3 rounded-[12px] bg-white px-4 py-3 ${CARD_SHADOW}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-petrol-100 text-petrol-700">
        <SectionIcon kind="check" className="h-3 w-3" />
      </span>
      <div className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Question {number}
        </div>
        <div className="text-[12px] text-ink">{question}</div>
      </div>
      <span className="rounded-md bg-petrol-100 px-2 py-1 text-[11.5px] font-semibold text-petrol-700">
        {answer}
      </span>
      <span className="cursor-pointer text-[10.5px] font-semibold text-gray-400 hover:text-petrol-700">
        Edit
      </span>
    </div>
  );
}

function ActiveQuestion({
  number,
  question,
  helper,
  children,
}: {
  number: number;
  question: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        Question {number}
      </div>
      <h2 className="m-0 mt-1.5 text-[22px] font-semibold tracking-tight text-ink">
        {question}
      </h2>
      <p className="mt-1.5 text-[12px] text-gray-500">{helper}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function UpcomingQuestion({
  number,
  question,
}: {
  number: number;
  question: string;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-gray-200">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        Question {number}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-600">{question}</div>
    </div>
  );
}

function ContinueButton() {
  return (
    <div className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-petrol-700 px-6 text-[13px] font-semibold tracking-tight text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
      Continue
      <span className="ml-2 text-white/80">→</span>
    </div>
  );
}

function BackLink() {
  return (
    <span className="cursor-pointer text-[11.5px] font-semibold text-gray-500 hover:text-petrol-700">
      ← Back
    </span>
  );
}

export { StartSessionCTA };
