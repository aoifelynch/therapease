import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { Logo } from '../components/Logo';
import { FloatingLabel } from '../components/FloatingLabel';
import { theme } from '../utils/theme';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const getRegistrationErrorMessage = (err) => {
    const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage.trim();
    }

    return 'Unable to create account. Please check your details and try again.';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters and include a number and special character');
      return;
    }
    if (!/(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password)) {
      setError('Password must include a number and special character');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(formData.email, formData.password, formData.name);
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/setup-2fa');
    } catch (err) {
      setError(getRegistrationErrorMessage(err));
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
            Get started for free
          </h1>
          <p className="text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
            Create your TherapEase account
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
            id="name" name="name" label="Full Name"
            placeholder="Jane Smith"
            value={formData.name} onChange={handleChange}
          />
          <FloatingLabel
            id="email" name="email" type="email" label="Email"
            placeholder="jane@example.com"
            value={formData.email} onChange={handleChange}
          />
          <FloatingLabel
            id="password" name="password" type="password" label="Password"
            placeholder="At least 8 characters, with a number and special character"
            value={formData.password} onChange={handleChange}
          />
          <FloatingLabel
            id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password"
            placeholder="Repeat your password"
            value={formData.confirmPassword} onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 mt-2"
            style={{
              backgroundColor: loading ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
              fontFamily: theme.fonts.serif,
              letterSpacing: '0.04em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(107, 126, 90, 0.35)',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = theme.colors.primary.dark; }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = theme.colors.primary.DEFAULT; }}
          >
            {loading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold transition-colors"
            style={{ color: theme.colors.primary.DEFAULT }}
          >
            Sign In
          </Link>
        </p>

        {/* Tagline / testimonial */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{ backgroundColor: 'rgba(107,126,90,0.08)', border: '1px solid rgba(107,126,90,0.15)' }}
        >
          <p className="text-sm leading-relaxed italic opacity-75" style={{ color: theme.colors.primary.darker, fontFamily: theme.fonts.serif }}>
            TherapEase helps therapists manage appointments, client records, payments and more — so you can focus on what matters most.
          </p>
        </div>
      </div>
    </div>
  );
};