import ExpensesContent from "@/components/expenses/ExpensesContent";

export const metadata = { title: "My Expenses" };

export default function AccountsExpensesPage() {
  return <ExpensesContent basePath="/accounts" scopeMine />;
}
