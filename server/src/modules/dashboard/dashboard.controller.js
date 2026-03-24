import { getDashboardStats } from "./dashboard.service.js";

/**
 * GET /api/dashboard/stats
 * Returns aggregated dashboard statistics.
 */
export async function getStats(req, res, next) {
  try {
    const stats = await getDashboardStats();
    res.json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
