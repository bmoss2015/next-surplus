import {
  CURRENT_LEAD,
  ESTATE,
  LAST_CONVERSATION,
  ACTIVITY,
  CONTACTS,
  QUEUE,
} from "../_data";
import {
  CanvasFrame,
  StatChrome,
  Logomark,
  LiveDot,
  ControlButton,
  Eyebrow,
} from "./Shared";

export function V46() {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-11 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatChrome compact />
          </div>
        </div>

        <header
          className="grid items-center gap-6 bg-gradient-to-r from-[#04261c] via-[#0a3d4a] to-[#0d6c7d] px-7 text-white"
          style={{ height: 200, gridTemplateColumns: "auto 1fr auto" }}
        >
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-[24px] font-bold ring-2 ring-inset ring-white/25">
              {CURRENT_LEAD.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <LiveDot />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">
                  {CURRENT_LEAD.state}
                </span>
                <span className="text-[10.5px] tabular-nums text-white/65">
                  {CURRENT_LEAD.leadId}
                </span>
              </div>
              <div className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
                {CURRENT_LEAD.name}
              </div>
              <div className="mt-0.5 font-mono text-[15px] text-white/85 tracking-wide">
                {CURRENT_LEAD.phone}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center rounded-xl bg-white/10 px-6 py-3 ring-1 ring-inset ring-white/15">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/65">
                Talk Time
              </div>
              <div className="font-mono text-[34px] font-semibold tabular-nums leading-none">
                {CURRENT_LEAD.talkTimer}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ControlButton label="Mute" />
            <ControlButton label="Keypad" />
            <ControlButton label="Hold" />
            <ControlButton label="Note" intent="primary" />
            <ControlButton label="End" intent="danger" />
          </div>
        </header>

        <section className="grid flex-1 grid-cols-3 divide-x divide-gray-200 bg-white">
          <div className="flex flex-col px-6 py-5">
            <Eyebrow tone="petrol">Estate Facts</Eyebrow>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
              {[
                ["Cause No.", ESTATE.causeNumber],
                ["Closing Bid", ESTATE.closingBid],
                ["Surplus", ESTATE.estimatedSurplus],
                ["Floor", ESTATE.surplusFloor],
                ["Fee", ESTATE.recoveryFee],
                ["Net to Owner", ESTATE.netToOwner],
                ["Probate Filed", ESTATE.probateFiled],
                ["Attorney", ESTATE.attorney],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    {k}
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Heirs of Record
              </span>
              <span className="text-[14px] font-semibold tabular-nums text-ink">
                {ESTATE.heirsOfRecord}
              </span>
            </div>
          </div>

          <div className="flex flex-col px-6 py-5">
            <div className="flex items-center justify-between">
              <Eyebrow tone="petrol">Last Conversation</Eyebrow>
              <div className="text-[10.5px] tabular-nums text-gray-500">
                {LAST_CONVERSATION.date} · {LAST_CONVERSATION.duration}
              </div>
            </div>
            <div className="mt-3 text-[12.5px] leading-relaxed text-ink">
              {LAST_CONVERSATION.summary}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10.5px]">
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                Mood: {LAST_CONVERSATION.mood}
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                Next: Documentation + Loretta
              </span>
            </div>
          </div>

          <div className="flex flex-col px-6 py-5">
            <Eyebrow tone="petrol">Recent Activity</Eyebrow>
            <ul className="mt-3 space-y-2.5">
              {ACTIVITY.map((a) => (
                <li key={a.when} className="flex items-baseline gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
                  <div className="flex-1">
                    <div className="text-[11.5px] text-ink">{a.what}</div>
                    <div className="text-[10px] tabular-nums text-gray-400">
                      {a.when}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-200 pt-3">
              <Eyebrow tone="gray">Contact Tree</Eyebrow>
              <div className="mt-2 space-y-1.5">
                {CONTACTS.slice(0, 3).map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="ml-1.5 text-[10px] text-gray-500">
                        {c.role}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px] text-gray-600">
                      {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center gap-3 border-t border-gray-200 bg-gray-50 px-7 py-4">
          <Eyebrow tone="gray">Queue</Eyebrow>
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            {QUEUE.slice(0, 10).map((q, i) => {
              const active = q.state === "active";
              return (
                <div
                  key={q.id}
                  className={`flex w-[136px] shrink-0 flex-col rounded-lg border px-3 py-2 ${
                    active
                      ? "border-petrol-700 bg-white shadow-card"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
                        active ? "text-petrol-700" : "text-gray-400"
                      }`}
                    >
                      {active ? "Live" : `${i + 1}`}
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums text-ink">
                      {q.surplus}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[11.5px] font-semibold text-ink">
                    {q.name}
                  </div>
                  <div className="truncate text-[10px] text-gray-500">
                    {q.city}
                  </div>
                </div>
              );
            })}
          </div>
        </footer>
      </div>
    </CanvasFrame>
  );
}
