import { describe, expect, test, beforeEach, jest } from '@jest/globals';

const createAxiosMock = () => {
  const requestHandlers = [];
  const responseHandlers = [];

  const instance = jest.fn((requestConfig) => Promise.resolve({ config: requestConfig, data: { replayed: true } }));
  instance.get = jest.fn();
  instance.post = jest.fn();
  instance.put = jest.fn();
  instance.delete = jest.fn();
  instance.patch = jest.fn();
  instance.interceptors = {
    request: {
      use: jest.fn((onFulfilled, onRejected) => {
        requestHandlers.push({ onFulfilled, onRejected });
      }),
    },
    response: {
      use: jest.fn((onFulfilled, onRejected) => {
        responseHandlers.push({ onFulfilled, onRejected });
      }),
    },
  };

  return { instance, requestHandlers, responseHandlers };
};

const createLocalStorageMock = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

describe('api client', () => {
  let axiosMock;
  let apiInstance;
  let requestHandlers;
  let responseHandlers;
  let toast;
  let apiModule;

  beforeEach(async () => {
    jest.resetModules();

    const axiosState = createAxiosMock();
    apiInstance = axiosState.instance;
    requestHandlers = axiosState.requestHandlers;
    responseHandlers = axiosState.responseHandlers;

    axiosMock = {
      create: jest.fn(() => apiInstance),
      post: jest.fn(),
    };

    await jest.unstable_mockModule('axios', () => ({ default: axiosMock }));

    global.localStorage = createLocalStorageMock();
    global.window = { location: { pathname: '/dashboard', href: '' } };

    apiModule = await import('../api.js');
    ({ toast } = await import('../../utils/toastBus.js'));
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  test('adds bearer tokens to outgoing requests', () => {
    global.localStorage.setItem('accessToken', 'access-token');

    const requestHandler = requestHandlers[0].onFulfilled;
    const nextConfig = requestHandler({ headers: {} });

    expect(nextConfig.headers.Authorization).toBe('Bearer access-token');
  });

  test('toasts non-GET successes', async () => {
    const responseHandler = responseHandlers[0].onFulfilled;

    await responseHandler({
      config: { method: 'post' },
      data: { message: 'Saved successfully' },
    });

    expect(toast.success).toHaveBeenCalledWith('Saved successfully');
  });

  test('refreshes tokens and retries once on a 401 response', async () => {
    global.localStorage.setItem('refreshToken', 'refresh-token');
    axiosMock.post.mockResolvedValue({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: 'user-1' },
      },
    });

    const responseHandler = responseHandlers[0].onRejected;
    const originalRequest = { url: '/clients', headers: {}, _retry: false };

    const result = await responseHandler({
      config: originalRequest,
      response: { status: 401, data: { message: 'Unauthorized' } },
      message: 'Unauthorized',
    });

    expect(axiosMock.post).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/refresh',
      { refreshToken: 'refresh-token' },
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    expect(global.localStorage.getItem('accessToken')).toBe('new-access');
    expect(global.localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(result).toEqual({ config: expect.objectContaining({ headers: { Authorization: 'Bearer new-access' } }), data: { replayed: true } });
    expect(apiInstance).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer new-access' } }));
  });

  test('clears auth storage and redirects on refresh failure', async () => {
    global.localStorage.setItem('accessToken', 'expired');
    global.localStorage.setItem('refreshToken', 'refresh-token');
    global.localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
    axiosMock.post.mockRejectedValue(new Error('Refresh failed'));

    const responseHandler = responseHandlers[0].onRejected;

    await expect(responseHandler({
      config: { url: '/clients', headers: {}, _retry: false },
      response: { status: 401, data: { message: 'Unauthorized' } },
      message: 'Unauthorized',
    })).rejects.toThrow('Refresh failed');

    expect(global.localStorage.getItem('accessToken')).toBeNull();
    expect(global.localStorage.getItem('refreshToken')).toBeNull();
    expect(global.localStorage.getItem('user')).toBeNull();
    expect(global.window.location.href).toBe('/login');
  });
});