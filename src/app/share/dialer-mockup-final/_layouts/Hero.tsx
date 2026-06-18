import type { Lead } from "../_data";
import {
  CaseTypeChip,
  StatusBadge,
  HeroDivider,
  FinancialStack,
  LeadSummary,
  ControlRow,
  OutcomeRow,
  QuickNoteInput,
  SkipFollowUpToggle,
  CountdownBanner,
  PETROL_GRADIENT,
} from "./Shared";

export function Hero({
  lead,
  state = "live",
  nextLead,
}: {
  lead: Lead;
  state?: "live" | "wrap";
  nextLead?: { name: string; relationship: string; countdown: string };
}) {
  const wrap = state === "wrap";
  return (
    <div className={`relative flex h-full flex-col text-white ${PETROL_GRADIENT}`}>
      {wrap && nextLead && (
        <CountdownBanner
          nextName={nextLead.name}
          nextRelationship={nextLead.relationship}
          countdown={nextLead.countdown}
        />
      )}

      <div className="flex flex-1 flex-col px-8 pt-6 pb-7">
        <div className="flex items-start justify-between gap-4">
          <CaseTypeChip
            caseType={lead.caseType}
            index={lead.contactIndex}
            total={lead.contactTotal}
          />
          <StatusBadge state={wrap ? "ended" : "live"} timer={lead.talkTimer} />
        </div>

        <div className="mt-6 flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-[28px] font-semibold leading-tight tracking-tight">
              {lead.title}
            </div>
            <div className="mt-1.5 text-[13px] text-white/80">
              {lead.relationship}
            </div>
            <div
              className="mt-2 whitespace-nowrap font-mono text-[15px] tracking-wide text-white/90 tabular-nums"
            >
              {lead.phone}
            </div>
            <div className="mt-1 text-[11.5px] text-white/65">
              {lead.address.split(",").map((part, i, arr) => (
                <span key={i}>
                  {part.trim()}
                  {i < arr.length - 1 && (
                    <>
                      ,<wbr />
                      {" "}
                    </>
                  )}
                </span>
              ))}
            </div>
          </div>
          <FinancialStack lead={lead} />
        </div>

        <HeroDivider />

        <LeadSummary lead={lead} dim={wrap} />

        <div className="mt-auto">
          <HeroDivider />
          {wrap ? (
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-white">
                How did the call go?
              </div>
              <div className="mt-3">
                <OutcomeRow />
              </div>
              <QuickNoteInput />
              <SkipFollowUpToggle />
            </div>
          ) : (
            <ControlRow />
          )}
        </div>
      </div>
    </div>
  );
}
