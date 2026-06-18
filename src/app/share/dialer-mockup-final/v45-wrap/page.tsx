import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";

export default function V45WrapPage() {
  return (
    <FullFrame
      label="V45 · Wrap Up"
      liveHref="/share/dialer-mockup-final/v45"
      wrapHref="/share/dialer-mockup-final/v45-wrap"
      active="wrap"
    >
      <V45 wrap />
    </FullFrame>
  );
}
