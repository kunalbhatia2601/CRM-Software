import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Ad Budget" };

// Built in the next step of the marketing plan.
export default function MarketingAdBudgetPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ad Budget"
        breadcrumbs={[{ label: "Dashboard", href: "/marketing/dashboard" }, { label: "Ad Budget" }]}
      />
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">Coming in the next build step.</p>
      </div>
    </div>
  );
}
