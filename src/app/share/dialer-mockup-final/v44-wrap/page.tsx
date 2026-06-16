import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";

export default function V44WrapPage() {
  return (
    <FullFrame
      label="V44 · Wrap Up"
      liveHref="/share/dialer-mockup-final/v44"
      wrapHref="/share/dialer-mockup-final/v44-wrap"
      active="wrap"
    >
      <V44 wrap />
    </FullFrame>
  );
}
