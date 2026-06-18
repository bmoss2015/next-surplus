import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";

const TABS = [
  { key: "live", label: "Live Call", href: "/share/dialer-mockup-final/v44" },
  { key: "wrap", label: "Wrap Up", href: "/share/dialer-mockup-final/v44-wrap" },
];

export default function V44WrapPage() {
  return (
    <FullFrame label="V44 · Wrap Up" tabs={TABS} active="wrap">
      <V44 wrap />
    </FullFrame>
  );
}
