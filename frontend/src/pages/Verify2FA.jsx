import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { twoFactorAPI } from '../api/api';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export const Verify2FA = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { user, tempUserId } = location.state || {};

  if (!user || !tempUserId) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-6 py-12" style={{ backgroundColor: theme.colors.secondary.cream }}>
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.6 }} />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.darker, opacity: 0.5 }} />
        <div className="absolute top-1/3 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.55 }} />
        <div className="absolute bottom-1/3 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.DEFAULT, opacity: 0.2 }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.15 }} />

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="mb-10 flex justify-center">
            <Logo />
          </div>
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}`, fontFamily: theme.fonts.serif }}
          >
            <span>⚠</span> Invalid 2FA session. Please log in again.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
              fontFamily: theme.fonts.serif,
              letterSpacing: '0.04em',
              boxShadow: `0 4px 14px ${withAlpha(theme.colors.primary.DEFAULT, 0.35)}`,
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await twoFactorAPI.verifyLogin(code, tempUserId);
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-6 py-12" style={{ backgroundColor: theme.colors.secondary.cream }}>
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.6 }} />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.darker, opacity: 0.5 }} />
      <div className="absolute top-1/3 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.55 }} />
      <div className="absolute bottom-1/3 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.DEFAULT, opacity: 0.2 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.15 }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-medium mb-1"
            style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.charcoal }}
          >
            Two-factor authentication
          </h1>
          <p className="text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
            Enter the code from your authenticator app
          </p>
        </div>

        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}`, fontFamily: theme.fonts.serif }}
          >
            <span>⚠</span> {error}
          </div>
        )}

        <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.08), border: `1px solid ${withAlpha(theme.colors.primary.DEFAULT, 0.15)}` }}>
          <p className="text-sm" style={{ color: theme.colors.primary.darker, fontFamily: theme.fonts.serif }}>
            Verifying as: <strong style={{ color: theme.colors.secondary.charcoal }}>{user?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label htmlFor="code">Authentication Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength="6"
              inputMode="numeric"
              autoComplete="off"
              className="w-full px-3 py-3 border rounded-lg text-center text-2xl tracking-widest transition-all focus:outline-none"
              style={{
                borderColor: theme.colors.secondary.beige,
                fontFamily: theme.fonts.serif,
                color: theme.colors.secondary.charcoal,
                backgroundColor: theme.colors.gray[50],
              }}
            />
            <small className="text-xs block mt-1" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
              Enter the 6-digit code from your authenticator app
            </small>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200"
            style={{
              backgroundColor: loading || code.length !== 6 ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
              fontFamily: theme.fonts.serif,
              letterSpacing: '0.04em',
              cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              boxShadow: loading || code.length !== 6 ? 'none' : `0 4px 14px ${withAlpha(theme.colors.primary.DEFAULT, 0.35)}`,
            }}
            onMouseEnter={e => { if (!loading && code.length === 6) e.target.style.backgroundColor = theme.colors.primary.dark; }}
            onMouseLeave={e => { if (!loading && code.length === 6) e.target.style.backgroundColor = theme.colors.primary.DEFAULT; }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-xl font-medium text-sm transition-all duration-200 mt-3"
          style={{
            backgroundColor: theme.colors.gray[50],
            color: theme.colors.secondary.charcoal,
            border: `1px solid ${theme.colors.secondary.beige}`,
            fontFamily: theme.fonts.serif,
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};
