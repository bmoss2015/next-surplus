import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";
import { HAYES, QUEUE_DEFAULT, NEXT_LEAD_HAYES } from "../_data";

const TABS = [
  { key: "live", label: "Hayes Live", href: "/share/dialer-mockup-final/v45" },
  { key: "wrap", label: "Hayes Wrap Up", href: "/share/dialer-mockup-final/v45-wrap" },
  { key: "stateb", label: "Pemberton Live", href: "/share/dialer-mockup-final/v45-state-b" },
  { key: "drawer", label: "Drawer Open", href: "/share/dialer-mockup-final/v45-drawer-open" },
];

export default function V45WrapPage() {
  return (
    <FullFrame label="V45 · Wrap Up" tabs={TABS} active="wrap">
      <V45 lead={HAYES} queue={QUEUE_DEFAULT} state="wrap" nextLead={NEXT_LEAD_HAYES} />
    </FullFrame>
  );
}
