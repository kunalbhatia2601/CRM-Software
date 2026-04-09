"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Search, ExternalLink, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getDocuments } from "@/actions/documents.action";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "NDA", label: "NDA" },
  { value: "INVOICE", label: "Invoice" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REPORT", label: "Report" },
  { value: "OTHER", label: "Other" },
];

export default function SalesDocumentsContent({ initialData }) {
  const [documents, setDocuments] = useState(initialData?.documents || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const result = await getDocuments(params);
      if (result.success) setDocuments(result.data.documents || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Documents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Proposals, agreements, and other documents.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none">
          {TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : documents.length > 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{doc.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge value={doc.type} />
                    {doc.deal && <span className="text-xs text-slate-400">Deal: {doc.deal.title}</span>}
                    {doc.project && <span className="text-xs text-slate-400">Project: {doc.project.name}</span>}
                    <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {doc.requiresSignature && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${doc.isSigned ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"}`}>
                    {doc.isSigned ? "Signed" : "Needs Signature"}
                  </span>
                )}
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium text-[#5542F6] hover:bg-[#5542F6]/10 rounded-lg transition-colors flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No documents found.</p>
        </div>
      )}
    </div>
  );
}
