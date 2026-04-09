import { formatClock, formatLongDate, withAlpha } from '../utils/formatters';
import { theme } from '../utils/theme';

export const PageHeader = ({ userName, now, actions = null }) => (
  <header
    className="sticky top-0 z-10 flex flex-wrap items-center gap-3 px-6 py-4 md:px-8"
    style={{
      backgroundColor: withAlpha(theme.colors.gray[50], 0.92),
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
    }}
  >
    <h1 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
      Welcome, {(userName || 'there').split(' ')[0]}
    </h1>

    <div className="flex flex-1 items-center justify-center">
      {actions}
    </div>

    <span className="ml-auto text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
      {formatLongDate(now)} {formatClock(now)}
    </span>
  </header>
);
