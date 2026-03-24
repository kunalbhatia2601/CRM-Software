import { getDashboardStats } from "./dashboard.service.js";

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
    res.json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
