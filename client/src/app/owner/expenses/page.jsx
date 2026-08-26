import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "Expenses" };

export default function OwnerExpensesPage() {
  return <ExpensesContent basePath="/owner" />;
}
