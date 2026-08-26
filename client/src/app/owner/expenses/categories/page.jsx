import ExpenseCategoriesContent from "@/components/expenses/ExpenseCategoriesContent";

export const metadata = { title: "Expense Categories" };

export default function ExpenseCategoriesPage() {
  return <ExpenseCategoriesContent basePath="/owner" />;
}
