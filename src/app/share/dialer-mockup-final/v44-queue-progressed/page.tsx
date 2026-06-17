import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";
import { HAYES, QUEUE_PROGRESSED } from "../_data";

const TABS = [
  { key: "live", label: "Hayes Live", href: "/share/dialer-mockup-final/v44" },
  { key: "wrap", label: "Hayes Wrap Up", href: "/share/dialer-mockup-final/v44-wrap" },
  { key: "stateb", label: "Pemberton Live", href: "/share/dialer-mockup-final/v44-state-b" },
  { key: "progressed", label: "Queue Progressed", href: "/share/dialer-mockup-final/v44-queue-progressed" },
];

export default function V44QueueProgressedPage() {
  return (
    <FullFrame label="V44 · Queue Progressed" tabs={TABS} active="progressed">
      <V44 lead={HAYES} queue={QUEUE_PROGRESSED} queuePosition={3} />
    </FullFrame>
  );
}
