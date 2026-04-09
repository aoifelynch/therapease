import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeToToasts, toast as toastBus } from '../utils/toastBus';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

const ToastContext = createContext({
  toast: toastBus,
});

const toneByType = {
  success: {
    bg: withAlpha(theme.colors.secondary.sage, 0.9),
    border: withAlpha(theme.colors.primary.DEFAULT, 0.45),
    text: theme.colors.primary.darker,
  },
  error: {
    bg: withAlpha(theme.colors.error.bg, 0.95),
    border: withAlpha(theme.colors.error.border, 0.95),
    text: theme.colors.error.text,
  },
  info: {
    bg: withAlpha(theme.colors.primary.lighter, 0.45),
    border: withAlpha(theme.colors.primary.DEFAULT, 0.35),
    text: theme.colors.primary.darker,
  },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const removeToast = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => subscribeToToasts((incoming) => {
    setItems((current) => [...current, incoming]);

    if (incoming.duration <= 0) return;

    window.setTimeout(() => {
      removeToast(incoming.id);
    }, incoming.duration);
  }), [removeToast]);

  const contextValue = useMemo(() => ({ toast: toastBus }), []);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,420px)] flex-col gap-2">
        {items.map((item) => {
          const tone = toneByType[item.type] || toneByType.info;

          return (
            <div
              key={item.id}
              className="pointer-events-auto rounded-xl border px-4 py-3 shadow-sm"
              style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.text }}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-5">{item.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="rounded px-1 text-sm leading-none"
                  style={{ color: tone.text }}
                  aria-label="Dismiss notification"
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
