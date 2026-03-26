import { getDeal, getAccountManagers } from "@/actions/deals.action";
import { getServicesDropdown } from "@/actions/services.action";
import ConvertDealContent from "./ConvertDealContent";
import Link from "next/link";

function BackButton({ id }) {
  return (
    <Link
      href={`/owner/deals/${id}`}
      className="text-slate-600 hover:text-slate-900 bg-slate-200 px-4 py-2 rounded-lg transition-colors"
    >
      Back
    </Link>
  );
}

export default async function ConvertDealPage({ params }) {
  const { id } = await params;

  const [dealResult, accountManagers, services] = await Promise.all([
    getDeal(id),
    getAccountManagers(),
    getServicesDropdown(),
  ]);

  if (!dealResult.success) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500">Deal not found.</p>
        <BackButton id={"#"} />
      </div>
    );
  }

  if (dealResult.data.stage === "WON") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500">This deal has already been converted.</p>
        <BackButton id={id} />
      </div>
    );
  }

  if (dealResult.data.stage !== "NEGOTIATION") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500">Only deals in Negotiation stage can be converted.</p>
        <BackButton id={id} />
      </div>
    );
  }

  return (
    <ConvertDealContent
      initialDeal={dealResult.data}
      accountManagers={accountManagers}
      availableServices={services}
    />
  );
}
