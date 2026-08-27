import AdBudgetContent from "@/components/campaigns/AdBudgetContent";

export const metadata = { title: "Ad Budget" };

export default function AdminAdBudgetPage() {
  return <AdBudgetContent basePath="/admin" />;
}
