import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicJob } from "@/actions/jobs.action";
import JobApplyForm from "@/components/careers/JobApplyForm";
import { ArrowLeft, MapPin } from "lucide-react";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getPublicJob(slug);
  return { title: res.success ? res.data.title : "Careers" };
}

export default async function CareerJobPage({ params }) {
  const { slug } = await params;
  const res = await getPublicJob(slug);
  if (!res.success || !res.data) notFound();
  const job = res.data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> All positions
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-3">
            {job.department && <span>{job.department}</span>}
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{job.type?.replace("_", " ")}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{job.workMode?.replace("_", " ")}</span>
            {job.salaryRange && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">{job.salaryRange}</span>}
          </p>
          <div className="mt-5 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{job.description}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {job.status === "OPEN" ? (
            <JobApplyForm job={job} />
          ) : (
            <p className="text-center text-slate-400 py-6">This position is not currently accepting applications.</p>
          )}
        </div>
      </div>
    </div>
  );
}
