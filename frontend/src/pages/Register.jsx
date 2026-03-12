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
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(formData.email, formData.password, formData.name);
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.secondary.cream }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
       {/* Background circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: theme.colors.primary.light }} />
        <div className="absolute bottom-24 -right-12 w-48 h-48 rounded-full opacity-15" style={{ backgroundColor: theme.colors.primary.darker }} />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: theme.colors.primary.lighter }} />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-light leading-snug mb-6" style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.cream }}>
            Untangle Your<br />
            <h2 className= "font-semibold">Practice</h2>
            Administration
          </h2>
          <p className="text-sm leading-relaxed opacity-80 italic" style={{ color: theme.colors.secondary.sage, fontFamily: theme.fonts.serif }}>
            TherapEase helps therapists manage appointments, client records, payments and more, so you can focus on what matters most.
          </p>
        </div>

        <ul className="relative z-10 space-y-3 list-none">
          <li className="text-sm opacity-90" style={{ color: theme.colors.secondary.sage, fontFamily: theme.fonts.serif }}>· Integrated Booking & Automated Reminders</li>
          <li className="text-sm opacity-90" style={{ color: theme.colors.secondary.sage, fontFamily: theme.fonts.serif }}>· Secure Client Records & Session Notes</li>
          <li className="text-sm opacity-90" style={{ color: theme.colors.secondary.sage, fontFamily: theme.fonts.serif }}>· Stripe Payments with Automatic Receipts</li>
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Logo />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1
              className="text-3xl font-light mb-1"
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
              placeholder="At least 6 characters"
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
        </div>
      </div>
    </div>
  );
};