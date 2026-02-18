const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get auth headers
const getAuthHeaders = (accessToken) => {
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
  };
};

// Auth API calls
export const authAPI = {
  register: async (email, password, name) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, name })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  getMe: async (accessToken) => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(accessToken)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch user');
    return data;
  }
};

// 2FA API calls
export const twoFactorAPI = {
  setup: async (accessToken) => {
    const response = await fetch(`${API_BASE}/2fa/setup`, {
      method: 'GET',
      headers: getAuthHeaders(accessToken)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to setup 2FA');
    return data;
  },

  verifySetup: async (token, accessToken) => {
    const response = await fetch(`${API_BASE}/2fa/verify-setup`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to verify 2FA');
    return data;
  },

  verifyLogin: async (token, tempUserId) => {
    const response = await fetch(`${API_BASE}/2fa/verify-login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, tempUserId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to verify 2FA code');
    return data;
  }
};
