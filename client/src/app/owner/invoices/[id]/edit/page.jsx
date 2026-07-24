import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices.action";
import EditInvoiceContent from "@/components/invoices/EditInvoiceContent";

export default async function OwnerEditInvoicePage({ params }) {
  const { id } = await params;
  const res = await getInvoice(id);
  if (!res.success || !res.data) notFound();
  return <EditInvoiceContent basePath="/owner" invoice={res.data} />;
}
