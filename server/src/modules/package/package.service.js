import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const ITEM_INCLUDE = {
  service: {
    select: { id: true, name: true, price: true, salePrice: true, points: true, isActive: true },
  },
};

const PACKAGE_INCLUDE = {
  items: { include: ITEM_INCLUDE, orderBy: { id: "asc" } },
};

/** A package's items, each priced the way it will actually be sold. */
function withEffectivePrice(pkg) {
  if (!pkg) return pkg;
  return {
    ...pkg,
    items: pkg.items.map((item) => ({
      ...item,
      effectivePrice: item.priceOverride ?? item.service?.salePrice ?? item.service?.price ?? 0,
    })),
  };
}

class PackageService {
  /**
   * Validates every serviceId up front, so a bad id fails the whole create
   * instead of leaving a half-built package.
   */
  async #validateItems(items) {
    if (!items?.length) throw ApiError.badRequest("A package needs at least one service");

    const ids = [...new Set(items.map((i) => i.serviceId))];
    const services = await prisma.service.findMany({ where: { id: { in: ids } } });
    const found = new Set(services.map((s) => s.id));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) throw ApiError.badRequest(`Service(s) not found: ${missing.join(", ")}`);
  }

  async createPackage(data) {
    await this.#validateItems(data.items);

    const pkg = await prisma.servicePackage.create({
      data: {
        name: data.name,
        description: data.description || null,
        isActive: data.isActive !== false,
        items: {
          create: data.items.map((i) => ({
            serviceId: i.serviceId,
            quantity: i.quantity || 1,
            priceOverride: i.priceOverride ?? null,
          })),
        },
      },
      include: PACKAGE_INCLUDE,
    });

    return withEffectivePrice(pkg);
  }

  async listPackages({ page = 1, limit = 10, search, isActive, sortBy = "createdAt", sortOrder = "desc" }) {
    const skip = (page - 1) * limit;
    const where = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (isActive !== undefined) where.isActive = isActive === "true";

    const [packages, total] = await Promise.all([
      prisma.servicePackage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: PACKAGE_INCLUDE,
      }),
      prisma.servicePackage.count({ where }),
    ]);

    return {
      packages: packages.map(withEffectivePrice),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPackageById(id) {
    const pkg = await prisma.servicePackage.findUnique({ where: { id }, include: PACKAGE_INCLUDE });
    if (!pkg) throw ApiError.notFound("Package not found");
    return withEffectivePrice(pkg);
  }

  /**
   * Full replace: a package is catalog data edited in a builder form, not a
   * per-usage list, so "save" means "this is now the whole set" — unlike
   * addServicesToDeal/Project, which are additive because those really are
   * per-usage lists.
   */
  async updatePackage(id, data) {
    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Package not found");

    if (data.items) await this.#validateItems(data.items);

    const pkg = await prisma.$transaction(async (tx) => {
      if (data.name !== undefined || data.description !== undefined || data.isActive !== undefined) {
        await tx.servicePackage.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description || null }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });
      }

      if (data.items) {
        await tx.packageService.deleteMany({ where: { packageId: id } });
        await tx.packageService.createMany({
          data: data.items.map((i) => ({
            packageId: id,
            serviceId: i.serviceId,
            quantity: i.quantity || 1,
            priceOverride: i.priceOverride ?? null,
          })),
        });
      }

      return tx.servicePackage.findUnique({ where: { id }, include: PACKAGE_INCLUDE });
    });

    return withEffectivePrice(pkg);
  }

  async deletePackage(id) {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        dealServices: { select: { id: true } },
        projectServices: { select: { id: true } },
      },
    });
    if (!pkg) throw ApiError.notFound("Package not found");

    if (pkg.dealServices.length > 0 || pkg.projectServices.length > 0) {
      throw ApiError.badRequest(
        "This package has already been added to a deal or project. Deactivate it instead of deleting it."
      );
    }

    await prisma.servicePackage.delete({ where: { id } });
  }

  async getActivePackages() {
    const packages = await prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: PACKAGE_INCLUDE,
    });
    return packages.map(withEffectivePrice);
  }

  /**
   * Resolve a package into the exact shape addServicesToDeal/
   * addServicesToProject already accept: [{ serviceId, quantity, price }].
   * Nothing downstream needs to know packages exist.
   */
  async expandPackage(packageId) {
    const pkg = await prisma.servicePackage.findUnique({ where: { id: packageId }, include: PACKAGE_INCLUDE });
    if (!pkg) throw ApiError.notFound("Package not found");
    if (!pkg.isActive) throw ApiError.badRequest("This package is no longer active");

    return {
      package: pkg,
      services: pkg.items.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: Number(item.priceOverride ?? item.service?.salePrice ?? item.service?.price ?? 0),
      })),
    };
  }
}

export default new PackageService();
