import jwt from "jsonwebtoken";
import config from "../config/index.js";
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/apiError.js";

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

    // const refToken = await prisma.RefreshToken.findUnique({
    //   where: {
    //     userId: decoded.userId
    //   },
    // });

    // if (!refToken) {
    //   throw ApiError.unauthorized("Invalid access token");
    // }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is not active");
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
