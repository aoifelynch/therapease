import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { Logo } from '../components/Logo';
import { FloatingLabel } from '../components/FloatingLabel';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response.requires2FA) {
        navigate('/2fa-verify', {
          state: {
            user: response.user,
            tempUserId: response.tempUserId,
          },
        });
        return;
      }

      login(response.user, response.accessToken, response.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-6 py-12" style={{ backgroundColor: theme.colors.secondary.cream }}>
      {/* Background circles spread across the full page */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.6 }} />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.darker, opacity: 0.5 }} />
      <div className="absolute top-1/3 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.55 }} />
      <div className="absolute bottom-1/3 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.DEFAULT, opacity: 0.2 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.15 }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-medium mb-1"
            style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.charcoal }}
          >
            Sign in
          </h1>
          <p className="text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
            Welcome back to TherapEase
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingLabel
            id="email" name="email" type="email" label="Email"
            placeholder="jane@example.com"
            value={formData.email} onChange={handleChange}
          />
          <FloatingLabel
            id="password" name="password" type="password" label="Password"
            placeholder="Your password"
            value={formData.password} onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200"
            style={{
              backgroundColor: loading ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
              fontFamily: theme.fonts.serif,
              letterSpacing: '0.04em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : `0 4px 14px ${withAlpha(theme.colors.primary.DEFAULT, 0.35)}`,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = theme.colors.primary.dark; }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = theme.colors.primary.DEFAULT; }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold transition-colors"
            style={{ color: theme.colors.primary.DEFAULT }}
          >
            Get started for free
          </Link>
        </p>
      </div>
    </div>
  );
};