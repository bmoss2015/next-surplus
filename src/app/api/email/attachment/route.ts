import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns a short-lived signed URL for an attachment. The storage RLS already
// scopes by org via the path prefix, so we only need to verify the user is
// authenticated.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await sb.storage
    .from("email-attachments")
    .createSignedUrl(path, 300);
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "signed url failed" },
      { status: 500 }
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
