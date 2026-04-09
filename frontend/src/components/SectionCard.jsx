import { componentStyles } from '../utils/componentStyles';
import { theme } from '../utils/theme';

export const SectionCard = ({
  title,
  action = null,
  children,
  className = '',
  paddingClassName = 'p-6',
  bodyClassName = '',
}) => (
  <section className={`rounded-3xl ${paddingClassName} ${className}`.trim()} style={componentStyles.card}>
    {(title || action) && (
      <div className="mb-5 flex items-center justify-between gap-3">
        {title ? (
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
            {title}
          </h2>
        ) : <span />}
        {action}
      </div>
    )}

    <div className={bodyClassName}>{children}</div>
  </section>
);
