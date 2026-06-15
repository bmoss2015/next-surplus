import { redirect } from "next/navigation";

// v2 has five header variants under /v2/a through /v2/e. Default
// landing is variant A.
export default function V2Index() {
  redirect("/admin/imap-mockup/v2/a");
}
