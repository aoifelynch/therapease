import axios from 'axios';
import { toast } from '../utils/toastBus';

const apiBaseURL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';

const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(
    `${apiBaseURL}/auth/refresh`,
    { refreshToken: storedRefreshToken },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const nextAccessToken = response.data?.accessToken;
  const nextRefreshToken = response.data?.refreshToken;
  const nextUser = response.data?.user;

  if (!nextAccessToken || !nextRefreshToken) {
    throw new Error('Refresh response missing tokens');
  }

  localStorage.setItem('accessToken', nextAccessToken);
  localStorage.setItem('refreshToken', nextRefreshToken);

  if (nextUser) {
    localStorage.setItem('user', JSON.stringify(nextUser));
  }

  return nextAccessToken;
};

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || '').toLowerCase();
    const shouldToastSuccess = method && method !== 'get' && !response.config?.skipSuccessToast;

    if (shouldToastSuccess) {
      const successMessage = String(
        response.config?.toastSuccessMessage
        || response.data?.message
        || 'Action completed successfully.',
      ).trim();

      if (successMessage) {
        toast.success(successMessage);
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh')
      || requestUrl.includes('/auth/logout');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const nextAccessToken = await refreshPromise;
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${nextAccessToken}`,
        };

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    if (status === 401) {
      clearAuthStorage();
      redirectToLogin();
    }

    const shouldToastError = !originalRequest?.skipErrorToast;
    if (shouldToastError) {
      const errorMessage = String(
        error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Something went wrong.',
      ).trim();

      if (errorMessage) {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  async register(email, password, name) {
    const response = await api.post('/auth/register', { email, password, name }, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password }, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData, {
      skipErrorToast: true,
    });
    return response.data;
  },

  async deleteAccount(password) {
    const response = await api.delete('/auth/profile', {
      data: { password },
      skipErrorToast: true,
    });
    return response.data;
  }
};

// 2FA API
export const twoFactorAPI = {
  async setup() {
    const response = await api.get('/2fa/setup', {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async verifySetup(token) {
    const response = await api.post('/2fa/verify-setup', { token }, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async verifyLogin(token, tempUserId) {
    const response = await api.post('/2fa/verify-login', { token, tempUserId }, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  }
};

// Appointments API
export const appointmentsAPI = {
  async getAll(filters = {}) {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  },

  async getById(appointmentId) {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  async create(appointmentData) {
    const response = await api.post('/appointments', appointmentData, {
      toastSuccessMessage: 'Appointment created. A confirmation email has been sent to the client.',
      skipErrorToast: true,
    });
    return response.data;
  },

  async update(appointmentId, appointmentData) {
    const response = await api.patch(`/appointments/${appointmentId}`, appointmentData, {
      skipErrorToast: true,
    });
    return response.data;
  },

  async delete(appointmentId) {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response.data;
  }
};

// Clients API
export const clientsAPI = {
  async getAll() {
    const response = await api.get('/clients');
    return response.data;
  },

  async getById(clientId) {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  },

  async create(clientData) {
    const response = await api.post('/clients', clientData, {
      skipErrorToast: true,
    });
    return response.data;
  },

  async update(clientId, clientData) {
    const response = await api.put(`/clients/${clientId}`, clientData, {
      skipErrorToast: true,
    });
    return response.data;
  },

  async delete(clientId) {
    const response = await api.delete(`/clients/${clientId}`, {
      skipErrorToast: true,
    });
    return response.data;
  },

  async getAppointments(clientId) {
    const response = await api.get(`/clients/${clientId}/appointments`);
    return response.data;
  },

  async getNotes(clientId) {
    const response = await api.get(`/clients/${clientId}/notes`);
    return response.data;
  },

  async createNote(clientId, noteData) {
    const response = await api.post(`/clients/${clientId}/notes`, noteData);
    return response.data;
  }
};

// Notes API
export const notesAPI = {
  async getAll() {
    const response = await api.get('/notes');
    return response.data;
  },

  async getById(noteId) {
    const response = await api.get(`/notes/${noteId}`);
    return response.data;
  },

  async create(noteData) {
    const response = await api.post('/notes', noteData);
    return response.data;
  },

  async update(noteId, noteData) {
    const response = await api.put(`/notes/${noteId}`, noteData);
    return response.data;
  },

  async delete(noteId) {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  }
};

// Files API
export const filesAPI = {
  async getAll() {
    const response = await api.get('/files');
    return response.data;
  },

  async upload(fileData) {
    const response = await api.post('/files', fileData);
    return response.data;
  },

  async delete(fileId) {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  }
};

// Payments API
export const paymentsAPI = {
  async getAll() {
    const response = await api.get('/payments');
    return response.data;
  },

  async createSession(sessionData) {
    const response = await api.post('/payments/create-session', sessionData, {
      toastSuccessMessage: 'Payment link sent successfully',
      skipErrorToast: true,
    });
    return response.data;
  },

  async sendReminder(paymentId) {
    const response = await api.post(`/payments/${paymentId}/send-reminder`, {}, {
      skipSuccessToast: true,
    });
    return response.data;
  }
};

// Reminders API
export const remindersAPI = {
  async getAll() {
    const response = await api.get('/reminders');
    return response.data;
  },

  async getIssues() {
    const response = await api.get('/reminders/issues');
    return response.data;
  },

  async create(reminderData) {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  }
};

// Todos API
export const todosAPI = {
  async getAll() {
    const response = await api.get('/todos', {
      skipSuccessToast: true,
    });
    return response.data;
  },

  async create(todoData) {
    const response = await api.post('/todos', todoData, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async update(todoId, todoData) {
    const response = await api.patch(`/todos/${todoId}`, todoData, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },

  async delete(todoId) {
    const response = await api.delete(`/todos/${todoId}`, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    return response.data;
  },
};

export default api;
