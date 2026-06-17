import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";
import { HAYES, QUEUE_DEFAULT } from "../_data";

const TABS = [
  { key: "live", label: "Hayes Live", href: "/share/dialer-mockup-final/v45" },
  { key: "wrap", label: "Hayes Wrap Up", href: "/share/dialer-mockup-final/v45-wrap" },
  { key: "stateb", label: "Pemberton Live", href: "/share/dialer-mockup-final/v45-state-b" },
  { key: "drawer", label: "Drawer Open", href: "/share/dialer-mockup-final/v45-drawer-open" },
];

export default function V45Page() {
  return (
    <FullFrame label="V45 · Centered Cockpit + Drawer" tabs={TABS} active="live">
      <V45 lead={HAYES} queue={QUEUE_DEFAULT} />
    </FullFrame>
  );
}
