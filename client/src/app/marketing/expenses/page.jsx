import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "My Expenses" };

// Marketing claims expenses like any employee — ad spend lives in the ad
// budget ledger, not here.
export default function MarketingExpensesPage() {
  return <ExpensesContent basePath="/marketing" scopeMine />;
}
