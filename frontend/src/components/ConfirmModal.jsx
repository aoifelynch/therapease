import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { ModalShell } from './ModalShell';

export const ConfirmModal = ({
  isOpen,
  title,
  description,
  errorMessage,
  onCancel,
  onConfirm,
  isBusy = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  children,
  maxWidthClass = 'max-w-md',
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      closeDisabled={isBusy}
      maxWidthClass={maxWidthClass}
      overlayStyle={{ backgroundColor: withAlpha(theme.colors.secondary.charcoal, 0.4) }}
      showClose={false}
    >
        {description && (
          <p className="mt-3 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.76) }}>
            {description}
          </p>
        )}

        {children}

        {errorMessage && (
          <div
            className="mt-4 rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
              border: `1px solid ${theme.colors.error.border}`,
              color: theme.colors.error.text,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7), color: theme.colors.secondary.charcoal }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: isBusy ? withAlpha(theme.colors.error.text, 0.6) : theme.colors.error.text,
              color: theme.colors.gray[50],
            }}
          >
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
    </ModalShell>
  );
};
