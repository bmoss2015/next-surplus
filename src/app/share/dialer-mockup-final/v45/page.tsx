import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";

export default function V45Page() {
  return (
    <FullFrame
      label="V45 · Centered Cockpit + Drawer"
      liveHref="/share/dialer-mockup-final/v45"
      wrapHref="/share/dialer-mockup-final/v45-wrap"
      active="live"
    >
      <V45 />
    </FullFrame>
  );
}
