import { theme } from './theme';
import { withAlpha } from './formatters';

export const componentStyles = {
  card: {
    backgroundColor: theme.colors.gray[50],
    border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.8)}`,
    boxShadow: `0 12px 28px ${withAlpha(theme.colors.secondary.charcoal, 0.06)}`,
  },

  sectionTitle: {
    color: theme.colors.secondary.charcoal,
    fontFamily: theme.fonts.sans,
  },

  subtleText: withAlpha(theme.colors.secondary.charcoal, 0.58),
  mutedText: withAlpha(theme.colors.secondary.charcoal, 0.7),
  faintText: withAlpha(theme.colors.secondary.charcoal, 0.5),

  border: withAlpha(theme.colors.secondary.beige, 0.9),
  lightBorder: withAlpha(theme.colors.secondary.beige, 0.45),
  subtleBorder: withAlpha(theme.colors.secondary.beige, 0.85),

  getReminderTone: (status) => {
    if (status === 'cancelled') {
      return {
        dot: theme.colors.error.text,
        background: withAlpha(theme.colors.error.bg, 0.9),
      };
    }
    if (status === 'sent') {
      return {
        dot: theme.colors.primary.DEFAULT,
        background: withAlpha(theme.colors.secondary.sage, 0.9),
      };
    }
    return {
      dot: theme.colors.primary.light,
      background: withAlpha(theme.colors.primary.lighter, 0.4),
    };
  },

  getStatusTone: (status) => {
    if (status === 'cancelled') {
      return {
        background: theme.colors.error.bg,
        color: theme.colors.error.text,
      };
    }
    if (status === 'completed') {
      return {
        background: withAlpha(theme.colors.secondary.sage, 0.9),
        color: theme.colors.primary.darker,
      };
    }
    return {
      background: withAlpha(theme.colors.primary.lighter, 0.45),
      color: theme.colors.primary.darker,
    };
  },

  getZebraRow: (index) => (index % 2 === 1 ? withAlpha(theme.colors.secondary.beige, 0.28) : 'transparent'),
};
