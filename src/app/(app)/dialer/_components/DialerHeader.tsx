"use client";

import {
  IconPlayerPause,
  IconPlayerStop,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useState } from "react";

type Metric = {
  label: string;
  value: string;
  delta: number;
  detail: string;
  hideTrend?: boolean;
};

const METRICS: Metric[] = [
  {
    label: "Dials",
    value: "32",
    delta: 1,
    detail: "Up 18% vs last 7 day average",
  },
  {
    label: "Connects",
    value: "11",
    delta: 1,
    detail: "Up 22% vs last 7 day average",
  },
  {
    label: "Rate",
    value: "34%",
    delta: 1,
    detail: "Up from 28% last session",
  },
  {
    label: "Total Talk Time",
    value: "47:12",
    delta: 0,
    detail: "Cumulative talk time across this session",
    hideTrend: true,
  },
];

export function DialerHeader({
  onPause,
  onEnd,
  paused,
}: {
  onPause: () => void;
  onEnd: () => void;
  paused: boolean;
}) {
  return (
    <header className="flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-8">
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight text-ink">
            Power Dialer
          </div>
          <div className="text-[11px] text-gray-500">
            {paused ? "Session Paused" : "Session In Progress"}
          </div>
        </div>

        <div className="flex items-stretch gap-6">
          {METRICS.map((m) => (
            <MetricColumn key={m.label} metric={m} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPause}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[13px] font-medium text-petrol-500 shadow-[0_1px_2px_rgba(15,23,41,0.06),0_2px_6px_-2px_rgba(15,23,41,0.10)] ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <IconPlayerPause size={15} stroke={2} />
          {paused ? "Resume Session" : "Pause Session"}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#b91c1c] px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(185,28,28,0.30),0_4px_10px_-2px_rgba(185,28,28,0.25)] transition hover:bg-[#a01818]"
        >
          <IconPlayerStop size={15} stroke={2} />
          End Session
        </button>
      </div>
    </header>
  );
}

function MetricColumn({ metric }: { metric: Metric }) {
  const [open, setOpen] = useState(false);
  const TrendIcon = metric.delta >= 0 ? IconTrendingUp : IconTrendingDown;
  const trendColor = metric.delta >= 0 ? "#15803d" : "#b91c1c";
  return (
    <div
      className="relative flex flex-col"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-gray-500">
        {metric.label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold leading-none text-ink tabular-nums">
          {metric.value}
        </span>
        {!metric.hideTrend && (
          <TrendIcon size={15} stroke={2.25} style={{ color: trendColor }} />
        )}
      </div>
      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-[11.5px] font-medium text-white shadow-lg"
        >
          {metric.detail}
        </div>
      )}
    </div>
  );
}
