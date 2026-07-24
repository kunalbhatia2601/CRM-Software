import { Suspense } from "react";
import CreateInvoiceContent from "@/components/invoices/CreateInvoiceContent";

export default function OwnerCreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoiceContent basePath="/owner" />
    </Suspense>
  );
}
