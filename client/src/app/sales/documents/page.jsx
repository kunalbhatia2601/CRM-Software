import { getDocuments } from "@/actions/documents.action";
import SalesDocumentsContent from "./SalesDocumentsContent";

export default async function SalesDocumentsPage() {
  const result = await getDocuments({ page: 1, limit: 50 });

  return <SalesDocumentsContent initialData={result.success ? result.data : { documents: [], pagination: {} }} />;
}
