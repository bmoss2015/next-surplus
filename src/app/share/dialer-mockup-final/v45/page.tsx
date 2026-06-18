import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";

const TABS = [
  { key: "live", label: "Live Call", href: "/share/dialer-mockup-final/v45" },
  { key: "wrap", label: "Wrap Up", href: "/share/dialer-mockup-final/v45-wrap" },
  {
    key: "drawer",
    label: "Drawer Open",
    href: "/share/dialer-mockup-final/v45-drawer-open",
  },
];

export default function V45Page() {
  return (
    <FullFrame
      label="V45 · Centered Cockpit + Drawer"
      tabs={TABS}
      active="live"
    >
      <V45 />
    </FullFrame>
  );
}
