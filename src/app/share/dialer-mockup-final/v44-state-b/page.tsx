import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";
import { PEMBERTON, QUEUE_PEMBERTON } from "../_data";

const TABS = [
  { key: "live", label: "Hayes Live", href: "/share/dialer-mockup-final/v44" },
  { key: "wrap", label: "Hayes Wrap Up", href: "/share/dialer-mockup-final/v44-wrap" },
  { key: "stateb", label: "Pemberton Live", href: "/share/dialer-mockup-final/v44-state-b" },
  { key: "progressed", label: "Queue Progressed", href: "/share/dialer-mockup-final/v44-queue-progressed" },
  { key: "timeline", label: "Timeline Open", href: "/share/dialer-mockup-final/v44-timeline-open" },
];

export default function V44StateBPage() {
  return (
    <FullFrame label="V44 · Pemberton" tabs={TABS} active="stateb">
      <V44 lead={PEMBERTON} queue={QUEUE_PEMBERTON} />
    </FullFrame>
  );
}
