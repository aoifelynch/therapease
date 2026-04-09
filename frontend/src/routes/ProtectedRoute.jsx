import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export const ProtectedRoute = ({ children, allowIncomplete2FA = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7), fontFamily: theme.fonts.sans }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const needs2FASetup = Boolean(user) && !user.twoFactorEnabled;

  if (needs2FASetup && !allowIncomplete2FA) {
    return <Navigate to="/setup-2fa" replace />;
  }

  if (!needs2FASetup && allowIncomplete2FA) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
