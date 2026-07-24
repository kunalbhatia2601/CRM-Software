import jwt from "jsonwebtoken";
import config from "../config/index.js";
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/apiError.js";
import cache from "../utils/cache.js";

const CACHE_KEY_SITE = "site";

const checkMaintainenceModeRoles = ["OWNER"];

/**
 * Verifies the JWT access token from the Authorization header
 * and attaches the user object to req.user
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token is required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        clientId: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is not active");
    }

    // get settings and check if site is on maintainence or not
    const site = await cache.get(CACHE_KEY_SITE, async () => {
      return prisma.site.findUnique({ where: { id: "default" } });
    }, 600);

    if (site?.isMaintenanceMode && !checkMaintainenceModeRoles.includes(user.role)) {
      throw ApiError.forbidden("Site is under maintenance");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Access token has expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(ApiError.unauthorized("Invalid access token"));
    }
    next(error);
  }
};

export default authenticate;
