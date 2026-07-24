import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices.action";
import InvoiceViewContent from "@/components/invoices/InvoiceViewContent";

export default async function AdminInvoiceDetailPage({ params }) {
  const { id } = await params;
  const res = await getInvoice(id);
  if (!res.success || !res.data) notFound();
  return <InvoiceViewContent basePath="/admin" invoice={res.data} />;
}
