import { getPublicJobs } from "@/actions/jobs.action";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crm.totemservices.org";

/**
 * Landing page plus every open role. Job pages are the only public content
 * that changes, so they carry the freshest lastModified.
 */
export default async function sitemap() {
  const routes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/careers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const res = await getPublicJobs();
    const jobs = res.success ? res.data : [];
    for (const job of jobs.filter((j) => j.status === "OPEN" && j.slug)) {
      routes.push({
        url: `${SITE_URL}/careers/${job.slug}`,
        lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // A sitemap without the job pages beats a build that fails on a cold API.
  }

  return routes;
}
