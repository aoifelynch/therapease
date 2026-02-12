import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export function decodeToken(token) {
  return jwt.decode(token);
}
