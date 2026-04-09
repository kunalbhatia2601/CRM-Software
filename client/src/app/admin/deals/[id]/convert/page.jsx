import { getDeal, getAccountManagers } from "@/actions/deals.action";
import { getServicesDropdown } from "@/actions/services.action";
import { getIsAIEnabled } from "@/actions/settings.action";
import ConvertDealContent from "./ConvertDealContent";
import Link from "next/link";

function BackButton({ id }) {
  return (
    <Link
      href={`/admin/deals/${id}`}
      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200 px-4 py-2 rounded-lg transition-colors"
    >
      Back
    </Link>
  );
}

export default async function ConvertDealPage({ params }) {
  const { id } = await params;

  const [dealResult, accountManagers, services, aiSettings] = await Promise.all([
    getDeal(id),
    getAccountManagers(),
    getServicesDropdown(),
    getIsAIEnabled(),
  ]);

  const aiEnabled = aiSettings.isAiConfigured;

  if (!dealResult.success) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Deal not found.</p>
        <BackButton id={"#"} />
      </div>
    );
  }

  if (dealResult.data.stage === "WON") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">This deal has already been converted.</p>
        <BackButton id={id} />
      </div>
    );
  }

  if (dealResult.data.stage !== "NEGOTIATION") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Only deals in Negotiation stage can be converted.</p>
        <BackButton id={id} />
      </div>
    );
  }

  return (
    <ConvertDealContent
      initialDeal={dealResult.data}
      accountManagers={accountManagers}
      availableServices={services}
      aiEnabled={aiEnabled}
    />
  );
}
