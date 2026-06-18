import { FullFrame } from "../_layouts/FullFrame";
import { V47 } from "../_layouts/V47";

export default function V47WrapPage() {
  return (
    <FullFrame
      label="V47 · Wrap Up"
      liveHref="/share/dialer-mockup-final/v47"
      wrapHref="/share/dialer-mockup-final/v47-wrap"
      active="wrap"
    >
      <V47 wrap />
    </FullFrame>
  );
}
