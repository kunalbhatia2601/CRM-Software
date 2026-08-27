import PageHeader from "@/components/ui/PageHeader";
import PaymentAccountsSettings from "@/components/invoices/PaymentAccountsSettings";

export const metadata = { title: "Payment Accounts" };

// Finance owns the money rails, so it manages these without needing the full
// owner settings screen.
export default function FinancePaymentAccountsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Payment Accounts"
        description="Bank and UPI details clients pay into."
        breadcrumbs={[{ label: "Dashboard", href: "/finance/dashboard" }, { label: "Payment Accounts" }]}
      />
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <PaymentAccountsSettings />
      </div>
    </div>
  );
}
