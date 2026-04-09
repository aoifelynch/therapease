import { componentStyles } from '../utils/componentStyles';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export const StatCard = ({ label, value, sub, color, accent }) => (
  <div className="overflow-hidden rounded-3xl" style={componentStyles.card}>
    <div className="px-4 py-2" style={{ backgroundColor: color }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.secondary.charcoal }}>
        {label}
      </p>
    </div>
    <div className="px-4 py-5">
      <p className="text-3xl font-semibold" style={{ color: accent }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>{sub}</p>
    </div>
  </div>
);
