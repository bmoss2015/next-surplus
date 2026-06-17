import { Suspense } from "react";
import { VerifyClient } from "./_VerifyClient";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={null}>
      <VerifyClient sessionId={params.session_id ?? null} />
    </Suspense>
  );
}
