import { getDashboardStats, getClientDashboardStats, getEmployeeDashboardStats, getSalesDashboardStats, getAccountDashboardStats, getHrDashboardStats, getFinanceDashboardStats } from "./dashboard.service.js";
import { ok } from "../../utils/apiResponse.js";
import prisma from "../../utils/prisma.js";

/**
 * GET /api/dashboard/stats?period=month|year|today|all
 * Returns aggregated dashboard statistics for the selected period.
 */
export async function getStats(req, res, next) {
  try {
    const period = req.query.period || "month";
    const allowed = ["all", "year", "today", "month"];
    const safePeriod = allowed.includes(period) ? period : "month";

    const stats = await getDashboardStats(safePeriod);
    return ok(res, "Dashboard statistics fetched successfully", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/client-stats
 * Returns dashboard statistics scoped to the CLIENT user's company.
 */
export async function getClientStats(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { clientId: true },
    });

    if (!user?.clientId) {
      return ok(res, "Client stats fetched", {
        projects: { total: 0, active: 0 },
        tasks: { total: 0, completed: 0, inReview: 0 },
        upcomingMilestones: [],
        recentDocuments: [],
        upcomingMeetings: [],
        projectsList: [],
      });
    }

    const stats = await getClientDashboardStats(user.clientId);
    return ok(res, "Client dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/employee-stats
 * Returns the EMPLOYEE user's own task workload. Scoped to tasks assigned to
 * them, not to their teams' projects — the employee dashboard is a work queue,
 * not a project overview.
 */
export async function getEmployeeStats(req, res, next) {
  try {
    const stats = await getEmployeeDashboardStats(req.user.id);
    return ok(res, "Employee dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/sales-stats
 * Returns dashboard statistics for the Sales Manager — pipeline view.
 */
export async function getSalesStats(req, res, next) {
  try {
    const stats = await getSalesDashboardStats();
    return ok(res, "Sales dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/account-stats
 * Returns dashboard statistics for the Account Manager — client & project view.
 */
export async function getAccountStats(req, res, next) {
  try {
    const stats = await getAccountDashboardStats(req.user.id);
    return ok(res, "Account manager dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/hr-stats
 * Returns attendance-focused stats for HR/OWNER/ADMIN.
 */
export async function getHrStats(_req, res, next) {
  try {
    const stats = await getHrDashboardStats();
    return ok(res, "HR dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/finance-stats
 * Billing overview for the FINANCE_MANAGER panel.
 */
export async function getFinanceStats(req, res, next) {
  try {
    const stats = await getFinanceDashboardStats({
      preset: req.query.preset,
      from: req.query.from,
      to: req.query.to,
    });
    return ok(res, "Finance dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}
