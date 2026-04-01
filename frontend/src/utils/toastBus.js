const listeners = new Set();

const DEFAULT_DURATION = 4500;

const normalizePayload = (payload = {}) => ({
  id: payload.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: payload.type || 'info',
  message: String(payload.message || '').trim(),
  duration: Number.isFinite(payload.duration) ? payload.duration : DEFAULT_DURATION,
});

export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const publishToast = (payload) => {
  const normalized = normalizePayload(payload);
  if (!normalized.message) return;

  listeners.forEach((listener) => {
    listener(normalized);
  });
};

export const toast = {
  success(message, options = {}) {
    publishToast({ ...options, type: 'success', message });
  },
  error(message, options = {}) {
    publishToast({ ...options, type: 'error', message });
  },
  info(message, options = {}) {
    publishToast({ ...options, type: 'info', message });
  },
};
