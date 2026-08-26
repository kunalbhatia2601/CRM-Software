import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "My Expenses" };

export default function SalesExpensesPage() {
  return <ExpensesContent basePath="/sales" scopeMine />;
}
