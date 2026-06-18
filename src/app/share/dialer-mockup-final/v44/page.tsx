import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";

export default function V44Page() {
  return (
    <FullFrame
      label="V44 · Three Zone Columns"
      liveHref="/share/dialer-mockup-final/v44"
      wrapHref="/share/dialer-mockup-final/v44-wrap"
      active="live"
    >
      <V44 />
    </FullFrame>
  );
}
