import Link from "next/link";
import { getPublicJobs } from "@/actions/jobs.action";
import { Briefcase, MapPin } from "lucide-react";

export const metadata = { title: "Careers" };

export default async function CareersPage() {
  const res = await getPublicJobs();
  const jobs = res.success ? res.data : [];
  const open = jobs.filter((j) => j.status === "OPEN");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Open Positions</h1>
        <p className="text-slate-500 mt-2">Join our team. Find a role that fits you.</p>

        <div className="mt-10 space-y-3">
          {open.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">No open positions right now. Check back soon.</p>
            </div>
          ) : (
            open.map((j) => (
              <Link key={j.id} href={`/careers/${j.slug}`}
                className="block p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#5542F6] hover:shadow-sm transition-all">
                <h2 className="text-lg font-semibold text-slate-900">{j.title}</h2>
                <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  {j.department && <span>{j.department}</span>}
                  {j.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{j.location}</span>}
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{j.type?.replace("_", " ")}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{j.workMode?.replace("_", " ")}</span>
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
