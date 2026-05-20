import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  fetchMailTemplates,
  fetchMailTemplateFolders,
} from "@/lib/settings/fetch";
import { MailTemplatesSection } from "@/app/(app)/settings/_components/MailTemplatesSection";
import { MailSectionTabs } from "../_components/MailSectionTabs";

export const dynamic = "force-dynamic";

export default async function MailTemplatesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const [templates, folders] = await Promise.all([
    fetchMailTemplates(),
    fetchMailTemplateFolders(),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <MailSectionTabs />
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold text-ink">Mail Templates</h1>
        <p className="text-[12px] text-gray-500">
          Letter templates and attachments used at send time.
        </p>
      </div>
      <MailTemplatesSection
        initialTemplates={templates}
        initialFolders={folders}
      />
    </div>
  );
}
