import { Suspense } from "react";
import { VerifyClient } from "./_VerifyClient";

export const dynamic = "force-dynamic";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyClient />
    </Suspense>
  );
}
