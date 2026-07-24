import { Suspense } from "react";
import CreateInvoiceContent from "@/components/invoices/CreateInvoiceContent";

export default function AdminCreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoiceContent basePath="/admin" />
    </Suspense>
  );
}
