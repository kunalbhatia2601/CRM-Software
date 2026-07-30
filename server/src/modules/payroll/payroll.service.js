import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { getKpiConfig, computeKpi, bonusForScore } from "./kpi.service.js";

const RECORD_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, employeeType: true } },
};

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

class PayrollService {
  // ── KPI config ──
  async getConfig() {
    return getKpiConfig();
  }

  async updateConfig(data) {
    await getKpiConfig(); // ensure row exists
    const patch = {};
    for (const k of ["weightAttendance", "weightCompletion", "weightOnTime", "weightReviewPass", "weightRework"]) {
      if (data[k] !== undefined) patch[k] = Number(data[k]);
    }
    if (data.bonusSlabs !== undefined) patch.bonusSlabs = data.bonusSlabs;
    if (data.presentStatuses !== undefined) patch.presentStatuses = data.presentStatuses;
    return prisma.kpiConfig.update({ where: { id: "default" }, data: patch });
  }

  /**
   * Compute (without saving) a single user's payroll for a month — live preview.
   */
  async previewUser(userId, year, month) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, basePay: true, role: true },
    });
    if (!user) throw ApiError.notFound("User not found");
    const config = await getKpiConfig();
    const kpi = await computeKpi(userId, year, month, config);
    const basePay = round2(user.basePay || 0);
    const bonus = round2(bonusForScore(kpi.score, config.bonusSlabs));
    return {
      user,
      year, month,
      basePay,
      kpiScore: kpi.score,
      breakdown: kpi,
      computedBonus: bonus,
      netPay: round2(basePay + bonus),
    };
  }

  /**
   * Generate/refresh payroll records for ALL active non-CLIENT users for a month.
   * Existing DRAFT records are recomputed; FINALIZED/PAID are left untouched.
   */
  async generate(year, month) {
    const config = await getKpiConfig();

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true, basePay: true },
    });

    let created = 0, updated = 0, skipped = 0;
    for (const u of users) {
      const existing = await prisma.payrollRecord.findUnique({
        where: { userId_year_month: { userId: u.id, year, month } },
      });
      if (existing && existing.status !== "DRAFT") { skipped++; continue; }

      const kpi = await computeKpi(u.id, year, month, config);
      const basePay = round2(u.basePay || 0);
      const bonus = round2(bonusForScore(kpi.score, config.bonusSlabs));
      const manual = existing ? Number(existing.manualAdjustment) : 0;
      const net = round2(basePay + bonus + manual);

      if (existing) {
        await prisma.payrollRecord.update({
          where: { id: existing.id },
          data: { basePay, kpiScore: kpi.score, breakdown: kpi, computedBonus: bonus, netPay: net },
        });
        updated++;
      } else {
        await prisma.payrollRecord.create({
          data: {
            userId: u.id, year, month, basePay,
            kpiScore: kpi.score, breakdown: kpi, computedBonus: bonus,
            manualAdjustment: 0, netPay: net, status: "DRAFT",
          },
        });
        created++;
      }
    }
    return { year, month, totalUsers: users.length, created, updated, skipped };
  }

  async list(year, month) {
    const records = await prisma.payrollRecord.findMany({
      where: { year, month },
      include: RECORD_INCLUDE,
      orderBy: { netPay: "desc" },
    });
    const totals = records.reduce((acc, r) => {
      acc.base += Number(r.basePay);
      acc.bonus += Number(r.computedBonus);
      acc.net += Number(r.netPay);
      return acc;
    }, { base: 0, bonus: 0, net: 0 });
    return { year, month, records, totals };
  }

  async getRecord(id) {
    const record = await prisma.payrollRecord.findUnique({ where: { id }, include: RECORD_INCLUDE });
    if (!record) throw ApiError.notFound("Payroll record not found");
    return record;
  }

  /**
   * Full payroll history for one user — every saved month, newest first.
   * Includes lifetime totals.
   */
  async getUserHistory(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, employeeType: true, basePay: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound("User not found");

    const records = await prisma.payrollRecord.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const totals = records.reduce((acc, r) => {
      acc.base += Number(r.basePay);
      acc.bonus += Number(r.computedBonus);
      acc.adjustment += Number(r.manualAdjustment);
      acc.net += Number(r.netPay);
      acc.paid += r.status === "PAID" ? Number(r.netPay) : 0;
      return acc;
    }, { base: 0, bonus: 0, adjustment: 0, net: 0, paid: 0, months: records.length });
    const avgKpi = records.length
      ? Math.round((records.reduce((a, r) => a + Number(r.kpiScore), 0) / records.length) * 10) / 10
      : 0;

    return { user, records, totals, avgKpi };
  }

  /**
   * Manual override: base pay, bonus, adjustment, status, notes. Recomputes net.
   */
  async updateRecord(id, data) {
    const existing = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Payroll record not found");

    const basePay = data.basePay !== undefined ? round2(data.basePay) : Number(existing.basePay);
    const bonus = data.computedBonus !== undefined ? round2(data.computedBonus) : Number(existing.computedBonus);
    const manual = data.manualAdjustment !== undefined ? round2(data.manualAdjustment) : Number(existing.manualAdjustment);
    const net = round2(basePay + bonus + manual);

    const patch = { basePay, computedBonus: bonus, manualAdjustment: manual, netPay: net };
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === "PAID" && !existing.paidAt) patch.paidAt = new Date();
      if (data.status !== "PAID") patch.paidAt = null;
    }
    return prisma.payrollRecord.update({ where: { id }, data: patch, include: RECORD_INCLUDE });
  }

  async deleteRecord(id) {
    const existing = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Payroll record not found");
    await prisma.payrollRecord.delete({ where: { id } });
  }

  /**
   * Set a user's monthly base pay (HR-accessible, unlike the owner-only user edit).
   */
  async setUserBasePay(userId, basePay) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role === "CLIENT") throw ApiError.badRequest("Clients do not have base pay");
    const value = basePay === null || basePay === "" ? null : round2(basePay);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { basePay: value },
      select: { id: true, firstName: true, lastName: true, basePay: true },
    });
    return updated;
  }
}

export default new PayrollService();
