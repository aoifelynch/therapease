import { componentStyles } from '../utils/componentStyles';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export const ModalShell = ({
  isOpen,
  onClose,
  closeDisabled = false,
  maxWidthClass = 'max-w-lg',
  overlayStyle,
  className = '',
  showClose = false,
  closeLabel = 'Close',
  title,
  titleStyle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto px-4 py-6"
      style={overlayStyle || { backgroundColor: withAlpha(theme.colors.secondary.charcoal, 0.35) }}
    >
      <div className={`w-full ${maxWidthClass} rounded-3xl p-6 ${className}`.trim()} style={componentStyles.card}>
        {(title || showClose) && (
          <div className="mb-5 flex items-center justify-between gap-3">
            {title ? (
              <h3 className="text-xl font-semibold" style={titleStyle || componentStyles.sectionTitle}>
                {title}
              </h3>
            ) : <span />}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="rounded-xl px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: withAlpha(theme.colors.secondary.beige, 0.65),
                  color: theme.colors.secondary.charcoal,
                  cursor: closeDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {closeLabel}
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
