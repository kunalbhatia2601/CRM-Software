import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const JOB_INCLUDE = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { applications: true } },
};

// Slugify a title → url-safe. Appends a short random-free suffix via counter on clash.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class JobService {
  async #uniqueSlug(base) {
    let slug = base || "job";
    let n = 1;
    // Loop until free. Deterministic, no Math.random.
    while (await prisma.job.findUnique({ where: { slug }, select: { id: true } })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    return slug;
  }

  async createJob(data, createdById) {
    const slug = await this.#uniqueSlug(slugify(data.title));
    return prisma.job.create({
      data: {
        slug,
        title: data.title,
        department: data.department || null,
        location: data.location || null,
        type: data.type || "FULL_TIME",
        workMode: data.workMode || "ON_SITE",
        description: data.description,
        salaryRange: data.salaryRange || null,
        status: data.status || "DRAFT",
        formFields: data.formFields ?? [],
        createdById,
      },
      include: JOB_INCLUDE,
    });
  }

  async listJobs({ page = 1, limit = 20, status, search }) {
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, include: JOB_INCLUDE, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.job.count({ where }),
    ]);
    return { jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getJobById(id) {
    const job = await prisma.job.findUnique({ where: { id }, include: JOB_INCLUDE });
    if (!job) throw ApiError.notFound("Job not found");
    return job;
  }

  async updateJob(id, data) {
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Job not found");

    const patch = {};
    for (const k of ["title", "department", "location", "type", "workMode", "description", "salaryRange", "status"]) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    if (data.formFields !== undefined) patch.formFields = data.formFields ?? [];

    return prisma.job.update({ where: { id }, data: patch, include: JOB_INCLUDE });
  }

  async deleteJob(id) {
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Job not found");
    await prisma.job.delete({ where: { id } });
  }

  // ── Public ──

  async listPublicJobs() {
    return prisma.job.findMany({
      where: { status: { in: ["OPEN", "CLOSED"] } },
      select: {
        id: true, slug: true, title: true, department: true, location: true,
        type: true, workMode: true, salaryRange: true, status: true, createdAt: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async getPublicJob(slug) {
    const job = await prisma.job.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, department: true, location: true,
        type: true, workMode: true, description: true, salaryRange: true,
        status: true, formFields: true, createdAt: true,
      },
    });
    if (!job || job.status === "DRAFT" || job.status === "ARCHIVED") {
      throw ApiError.notFound("Job not found");
    }
    return job;
  }

  // ── Applications ──

  async apply(slug, data) {
    const job = await prisma.job.findUnique({ where: { slug }, select: { id: true, status: true } });
    if (!job || job.status !== "OPEN") throw ApiError.badRequest("This position is not accepting applications");

    return prisma.jobApplication.create({
      data: {
        jobId: job.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        answers: data.answers ?? {},
        status: "NEW",
      },
    });
  }

  async listApplications(jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, title: true } });
    if (!job) throw ApiError.notFound("Job not found");
    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });
    return { job, applications };
  }

  async updateApplication(id, data) {
    const existing = await prisma.jobApplication.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Application not found");
    const patch = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    return prisma.jobApplication.update({ where: { id }, data: patch });
  }
}

export default new JobService();
