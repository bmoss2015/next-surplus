import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { InquiryForm } from "./InquiryForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicWebFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const sb = createServiceClient();
  const { data: form } = await sb
    .from("web_forms")
    .select("id, name, is_active, honeypot_field_name")
    .eq("id", formId)
    .maybeSingle();

  if (!form) notFound();

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-10 px-4">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {form.is_active ? (
            <>
              <h1 className="text-[20px] font-semibold text-ink">
                Get In Touch
              </h1>
              <p className="mb-6 mt-1.5 text-[13px] text-gray-600">
                Submit your details and a member of our team will follow up within one business day.
              </p>
              <InquiryForm
                formId={form.id}
                honeypotField={form.honeypot_field_name as string}
              />
            </>
          ) : (
            <div className="py-8 text-center">
              <h1 className="text-[18px] font-semibold text-ink">
                Not Accepting Submissions
              </h1>
              <p className="mt-2 text-[13px] text-gray-600">
                This form is not currently accepting submissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
