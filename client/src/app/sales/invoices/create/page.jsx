import { Suspense } from "react";
import CreateInvoiceContent from "@/components/invoices/CreateInvoiceContent";

export default function SalesCreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoiceContent basePath="/sales" />
    </Suspense>
  );
}
