import { Suspense } from "react";
import CreateInvoiceContent from "@/components/invoices/CreateInvoiceContent";

export default function FinanceCreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoiceContent basePath="/finance" />
    </Suspense>
  );
}
