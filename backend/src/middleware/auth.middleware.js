import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { HttpError, UNAUTHORIZED } from "../utils/HttpError.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(UNAUTHORIZED, "Access token required");
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      throw new HttpError(UNAUTHORIZED, "Access token required");
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new HttpError(UNAUTHORIZED, "User not found");
    }
    
    req.user = user;
    next();
  } catch (error) {
    // If it's already an HttpError, pass it along
    if (error.status) {
      next(error);
    } else {
      // JWT verification errors or other errors
      next(new HttpError(UNAUTHORIZED, "Invalid or expired access token"));
    }
  }
}
