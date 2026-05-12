import { fetchImportHistory } from "./_actions";
import { ImportWizard, ImportHistoryTable } from "./_components/ImportWizard";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const history = await fetchImportHistory();

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Imports
        </h1>
      </div>

      <ImportWizard />

      <div className="mt-8">
        <h2 className="m-0 mb-3 text-[14px] font-medium text-ink">
          Import History
        </h2>
        <ImportHistoryTable history={history} />
      </div>
    </div>
  );
}
