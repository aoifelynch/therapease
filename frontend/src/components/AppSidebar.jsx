import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { navItems } from '../constants/sidebarConstants';
import { SettingsIcon } from '../utils/icons';

export const AppSidebar = ({ activeNav, onNavSelect, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';
  const [hoveredNav, setHoveredNav] = useState('');

  const getUserFirstLastName = () => {
    const fullName = String(user?.name || '').trim();
    if (!fullName) return 'Therapist';

    const nameParts = fullName.split(/\s+/).filter(Boolean);
    if (nameParts.length === 1) return nameParts[0];

    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  };

  const userFirstLastName = getUserFirstLastName();

  const handleNavClick = (label) => {
    onNavSelect?.(label);

    if (label === 'Dashboard') {
      navigate('/dashboard');
      return;
    }

    if (label === 'Payments') {
      navigate('/payments');
      return;
    }

    if (label === 'Calendar') {
      navigate('/calendar');
      return;
    }

    if (label === 'Clients') {
      navigate('/clients');
      return;
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
          const isHovered = hoveredNav === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.label)}
              onMouseEnter={() => setHoveredNav(item.label)}
              onMouseLeave={() => setHoveredNav('')}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-md font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? withAlpha(theme.colors.primary.lighter, 0.45)
                  : (isHovered ? withAlpha(theme.colors.primary.lighter, 0.27) : 'transparent'),
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
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="relative flex w-full items-center gap-3 rounded-xl p-2 pr-12 text-left transition-colors"
          style={{
            backgroundColor: isSettingsPage ? withAlpha(theme.colors.primary.lighter, 0.38) : 'transparent',
          }}
        >
          <div className="min-w-0">
            <p className="text-md font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
              {userFirstLastName}
            </p>
          </div>
          <span
            aria-label="Settings"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors"
            style={{
              color: isSettingsPage ? theme.colors.primary.DEFAULT : withAlpha(theme.colors.secondary.charcoal, 0.55),
              backgroundColor: isSettingsPage ? withAlpha(theme.colors.primary.lighter, 0.48) : withAlpha(theme.colors.secondary.beige, 0.35),
            }}
          >
            <SettingsIcon />
            {isSettingsPage && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: theme.colors.primary.DEFAULT, border: `1px solid ${theme.colors.gray[50]}` }}
              />
            )}
          </span>
        </button>
      </div>
    </aside>
  );
};
