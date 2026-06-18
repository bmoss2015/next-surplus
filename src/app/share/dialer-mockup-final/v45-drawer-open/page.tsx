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

export default function V45DrawerOpenPage() {
  return (
    <FullFrame label="V45 · Drawer Open" tabs={TABS} active="drawer">
      <V45 drawerOpen />
    </FullFrame>
  );
}
