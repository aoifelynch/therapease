import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { navItems } from '../constants/sidebarConstants';
import { SettingsIcon } from '../utils/icons';

export const AppSidebar = ({ activeNav, onNavSelect, user }) => {
  const navigate = useNavigate();

  const handleNavClick = (label) => {
    onNavSelect?.(label);

    if (label === 'Dashboard') {
      navigate('/dashboard');
      return;
    }

    if (label === 'Clients') {
      navigate('/clients');
    }
  };

  return (
    <aside
      className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col px-5 py-8 md:flex"
      style={{
        backgroundColor: theme.colors.gray[50],
        borderRight: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.85)}`,
      }}
    >
      <div className="mb-10 flex flex-col items-center gap-4">
        <Logo className="justify-center" />
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.label)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-md font-medium transition-colors"
              style={{
                backgroundColor: isActive ? withAlpha(theme.colors.primary.lighter, 0.45) : 'transparent',
                color: isActive ? theme.colors.primary.darker : withAlpha(theme.colors.secondary.charcoal, 0.7),
              }}
            >
              <span style={{ color: isActive ? theme.colors.primary.DEFAULT : withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                <Icon />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t pt-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9) }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
              {user?.name || 'Therapist'}
            </p>
            <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.55) }}>
              {user?.email || 'Signed in'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="rounded-full p-2 transition-colors"
            style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.55), backgroundColor: withAlpha(theme.colors.secondary.beige, 0.35) }}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </aside>
  );
};
