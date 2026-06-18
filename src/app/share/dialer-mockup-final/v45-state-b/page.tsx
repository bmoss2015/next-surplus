import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";
import { PEMBERTON, QUEUE_PEMBERTON } from "../_data";

const TABS = [
  { key: "live", label: "Hayes Live", href: "/share/dialer-mockup-final/v45" },
  { key: "wrap", label: "Hayes Wrap Up", href: "/share/dialer-mockup-final/v45-wrap" },
  { key: "stateb", label: "Pemberton Live", href: "/share/dialer-mockup-final/v45-state-b" },
  { key: "drawer", label: "Drawer Open", href: "/share/dialer-mockup-final/v45-drawer-open" },
];

export default function V45StateBPage() {
  return (
    <FullFrame label="V45 · Pemberton (Foreclosure)" tabs={TABS} active="stateb">
      <V45 lead={PEMBERTON} queue={QUEUE_PEMBERTON} />
    </FullFrame>
  );
}
