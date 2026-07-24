import { Suspense } from "react";
import CreateInvoiceContent from "@/components/invoices/CreateInvoiceContent";

export default function AccountsCreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoiceContent basePath="/accounts" />
    </Suspense>
  );
}
