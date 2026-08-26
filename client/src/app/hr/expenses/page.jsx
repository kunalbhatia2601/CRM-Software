import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "My Expenses" };

export default function HrExpensesPage() {
  return <ExpensesContent basePath="/hr" scopeMine />;
}
