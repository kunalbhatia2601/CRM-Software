import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "Expenses" };

export default function FinanceExpensesPage() {
  return <ExpensesContent basePath="/finance" />;
}
