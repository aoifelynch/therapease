import User from '../models/User.js';
import { HttpError, BAD_REQUEST, UNAUTHORIZED } from '../utils/HttpError.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';

const safeUser = (user) => (user ? user.toJSON() : user);

// Generate access and refresh tokens
const generateTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { accessToken, refreshToken };
};

export default {
  // Register a new user
  async register(userData) {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
      throw new HttpError(BAD_REQUEST, "Email, password, and name are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new HttpError(BAD_REQUEST, "Email already exists");
    }

    // Hash password and create user
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email,
      name,
      passwordHash,
    });

    // Generate tokens
    const tokens = await generateTokens(user);

    return {
      user: safeUser(user),
      ...tokens,
    };
  },

  // Login user
  async login(email, password) {
    if (!email || !password) {
      throw new HttpError(BAD_REQUEST, "Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new HttpError(UNAUTHORIZED, "Invalid credentials");
    }

    // Verify password
    const passwordCorrect = await user.verifyPassword(password);
    if (!passwordCorrect) {
      throw new HttpError(UNAUTHORIZED, "Invalid credentials");
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        user: safeUser(user),
        requires2FA: true,
        accessToken: null,
        refreshToken: null,
      };
    }

    // Generate tokens only if 2FA is not required
    const tokens = await generateTokens(user);

    return {
      user: safeUser(user),
      ...tokens,
      requires2FA: false,
    };
  },

  // Refresh access token using a valid refresh token
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new HttpError(BAD_REQUEST, 'Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      throw new HttpError(UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new HttpError(UNAUTHORIZED, 'User not found');
    }

    const tokens = await generateTokens(user);

    return {
      user: safeUser(user),
      ...tokens,
    };
  },

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(UNAUTHORIZED, "User not found");
    }
    return safeUser(user);
  },

  // Update user profile
  async updateProfile(userId, updateData) {
    const { name, email, currentPassword, newPassword } = updateData;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(UNAUTHORIZED, "User not found");
    }

    const updates = {};

    // Update name if provided
    if (name !== undefined) {
      updates.name = name;
    }

    // Update email if provided
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new HttpError(BAD_REQUEST, "Email already exists");
      }
      updates.email = email;
    }

    // Update password if provided
    if (newPassword !== undefined) {
      if (!currentPassword) {
        throw new HttpError(BAD_REQUEST, "Current password is required to change password");
      }

      // Verify current password
      const passwordCorrect = await user.verifyPassword(currentPassword);
      if (!passwordCorrect) {
        throw new HttpError(UNAUTHORIZED, "Current password is incorrect");
      }

      // Hash new password
      updates.passwordHash = await User.hashPassword(newPassword);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    return safeUser(updatedUser);
  },

  // Delete user account
  async deleteAccount(userId, password) {
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(UNAUTHORIZED, "User not found");
    }

    // Verify password
    const passwordCorrect = await user.verifyPassword(password);
    if (!passwordCorrect) {
      throw new HttpError(UNAUTHORIZED, "Invalid password");
    }

    await User.findByIdAndDelete(userId).exec();
  },

  // Generate tokens (exported for 2FA verification)
  generateTokens
};
