import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "My Expenses" };

export default function EmployeeExpensesPage() {
  return <ExpensesContent basePath="/employee" scopeMine />;
}
