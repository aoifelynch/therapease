import authService from "../services/authService.js";

// User registration
export const register = async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    message: "User created successfully",
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

// User login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // has 2FA enabled
  if (result.requires2FA) {
    return res.status(200).json({
      message: "2FA required",
      requires2FA: true,
      user: result.user,
      tempUserId: result.user.id,
    });
  }

  // doesn't have 2FA enabled (normal login)
  res.status(200).json({
    message: "Login successful",
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

// Refresh access token endpoint
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);

  res.status(200).json({
    message: 'Token refreshed successfully',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
};

// Logout endpoint
export const logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// Check authentication status
export const getMe = async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  res.status(200).json({
    success: true,
    data: { authenticated: true, user },
    message: "User authenticated"
  });
};

// Update user profile
export const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    message: "Profile updated successfully",
    user
  });
};

// Delete user account
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  await authService.deleteAccount(req.user._id, password);

  res.status(200).json({
    message: "Account deleted successfully"
  });
};