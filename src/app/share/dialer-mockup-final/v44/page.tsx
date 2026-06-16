import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";

const TABS = [
  { key: "live", label: "Live Call", href: "/share/dialer-mockup-final/v44" },
  { key: "wrap", label: "Wrap Up", href: "/share/dialer-mockup-final/v44-wrap" },
];

export default function V44Page() {
  return (
    <FullFrame label="V44 · Three Zone Columns" tabs={TABS} active="live">
      <V44 />
    </FullFrame>
  );
}
