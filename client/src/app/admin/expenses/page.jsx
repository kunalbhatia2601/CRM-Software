import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "Expenses" };

export default function AdminExpensesPage() {
  return <ExpensesContent basePath="/admin" />;
}
