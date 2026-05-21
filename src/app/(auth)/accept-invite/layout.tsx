// The accept-invite page reads URL search params (token_hash, type) and
// instantiates a Supabase client at runtime. It has no meaningful
// prerendered HTML, so force dynamic rendering. Without this, the build
// tries to statically generate the page and fails whenever the preview
// environment is missing NEXT_PUBLIC_SUPABASE_URL (or any other build-time
// env access path the Supabase client reaches into).
export const dynamic = "force-dynamic";

export default function AcceptInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
