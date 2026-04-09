import { theme } from '../utils/theme';

export const PageTitleRow = ({ title, actions = null }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-3xl font-semibold leading-tight" style={{ color: theme.colors.secondary.charcoal }}>
      {title}
    </h2>
    {actions}
  </div>
);
