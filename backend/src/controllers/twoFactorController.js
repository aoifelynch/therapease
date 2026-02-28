import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/User.js";
import authService from "../services/authService.js";
import { HttpError, BAD_REQUEST, UNAUTHORIZED } from "../utils/HttpError.js";

const safeUser = (user) => (user ? user.toJSON() : user);

// Setup 2FA - Generate secret and QR code
export const setup2FA = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new HttpError(UNAUTHORIZED, "User not found");
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `TherapEase (${user.email})`,
    issuer: "TherapEase",
  });

  // Save temp secret to user (not confirmed yet)
  user.twoFactorTempSecret = secret.base32;
  await user.save();

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    message: "2FA setup initiated",
    secret: secret.base32,
    qrCode,
  });
};

// Verify 2FA setup - User must provide a valid code
export const verify2FASetup = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new HttpError(BAD_REQUEST, "Authentication code is required");
  }

  const user = await User.findById(req.user._id);
  if (!user || !user.twoFactorTempSecret) {
    throw new HttpError(BAD_REQUEST, "2FA setup not initiated");
  }

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorTempSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    throw new HttpError(BAD_REQUEST, "Invalid authentication code");
  }

  // Move temp secret to actual secret and enable 2FA
  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.twoFactorEnabled = true;
  await user.save();

  res.status(200).json({
    message: "2FA enabled successfully",
    user: safeUser(user),
  });
};

// Verify login with 2FA - User provides their TOTP code after successful password auth
export const verifyLogin2FA = async (req, res) => {
  const { token, tempUserId } = req.body;

  if (!token || !tempUserId) {
    throw new HttpError(BAD_REQUEST, "Authentication code and user ID are required");
  }

  const user = await User.findById(tempUserId);

  if (!user || !user.twoFactorEnabled) {
    throw new HttpError(BAD_REQUEST, "Invalid request");
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    throw new HttpError(BAD_REQUEST, "Invalid authentication code");
  }

  // Issue real tokens
  const tokens = await authService.generateTokens(user);

  res.status(200).json({
    message: "2FA verification successful",
    user: safeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};
