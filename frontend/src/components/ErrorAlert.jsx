import { theme } from '../utils/theme';

export const ErrorAlert = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${className}`.trim()}
      style={{
        backgroundColor: theme.colors.error.bg,
        color: theme.colors.error.text,
        border: `1px solid ${theme.colors.error.border}`,
      }}
    >
      {message}
    </div>
  );
};
