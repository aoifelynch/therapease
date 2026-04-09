import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { withAlpha } from '../utils/formatters';

/* ─── Navbar ─── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-white/90 backdrop-blur border-b border-gray-200' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex gap-8">
          {['Features', 'About', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium transition-colors" style={{ color: theme.colors.primary.darker }}>
              {item}
            </a>
          ))}
        </div>
        <div className="hidden md:flex gap-3">
          <Link to="/login">
            <button className="px-5 py-2 text-sm font-medium border rounded-lg transition-colors" style={{ borderColor: theme.colors.primary.DEFAULT, color: theme.colors.primary.DEFAULT }}>
              Sign In
            </button>
          </Link>
          <Link to="/register">
            <button className="px-5 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

/* ─── Hero Section ─── */
const Hero = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

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
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center pt-20 relative overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream }}>
      {/* Decorative circles */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.55 }} />
      <div className="absolute top-1/4 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.5 }} />
      <div className="absolute bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.DEFAULT, opacity: 0.15 }} />
      <div className="max-w-6xl mx-auto px-6 w-full py-16 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: theme.colors.primary.DEFAULT }}>
            Practice Management Software
          </p>

          <h1 className="text-5xl font-bold leading-tight mb-6 font-serif" style={{ color: theme.colors.secondary.charcoal }}>
            Untangle Your<br />Practice<br />
            <em className="font-serif italic" style={{ color: theme.colors.primary.DEFAULT }}>Administration</em>
          </h1>

          <p className="text-base mb-10 leading-relaxed max-w-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
            TherapEase helps therapists manage appointments, client records, payments and more — so you can focus on what matters most: your clients.
          </p>

          {/* Sign-up card */}
          <div className="rounded-2xl p-8 bg-white border" style={{ borderColor: theme.colors.secondary.beige }}>
            <p className="font-semibold mb-5" style={{ color: theme.colors.secondary.charcoal }}>
              Get started for free
            </p>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}` }}>
                <span>⚠</span> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors" placeholder="Full Name" name="name" value={formData.name} onChange={handleChange} style={{ borderColor: theme.colors.secondary.beige, color: theme.colors.secondary.charcoal }} />
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors" placeholder="Email" name="email" type="email" value={formData.email} onChange={handleChange} style={{ borderColor: theme.colors.secondary.beige, color: theme.colors.secondary.charcoal }} />
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors" placeholder="Password" name="password" type="password" value={formData.password} onChange={handleChange} style={{ borderColor: theme.colors.secondary.beige, color: theme.colors.secondary.charcoal }} />
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors" placeholder="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} style={{ borderColor: theme.colors.secondary.beige, color: theme.colors.secondary.charcoal }} />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-medium rounded-lg transition-colors text-sm"
                style={{ backgroundColor: loading ? theme.colors.primary.light : theme.colors.primary.DEFAULT, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Creating Account…' : 'Sign Up'}
              </button>
            </form>
            <p className="text-center mt-4 text-sm" style={{ color: theme.colors.gray[400] }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors" style={{ color: theme.colors.primary.DEFAULT }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <img src="../admin.png" alt="TherapEase platform" className="w-full rounded-3xl" />
          
          {/* Benefits */}
          <div className="w-full">
            <p className="text-xs font-semibold tracking-widest uppercase text-center mb-5" style={{ color: theme.colors.primary.DEFAULT }}>
              Benefits
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Integrated Calendar',
                'Detailed Reports & Statistics',
                'Automated Confirmation Emails & Reminder Texts',
                'Payments, Invoices & Receipts through Stripe',
                'Connected to Zoom for Online Sessions',
                'Client Profile with Notes, Appointments & Payment History',
                'All-in-One Workflow',
                'Integrated To-Do List',
                
              ].map((b, i) => (
                <div key={i} className="p-4 text-center rounded-xl text-sm font-medium" style={{ backgroundColor: theme.colors.primary.lighter, color: theme.colors.primary.darker }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => (
  <section id="features" className="py-24 relative overflow-hidden" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
    {/* Circles */}
    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.2 }} />
    <div className="absolute bottom-0 -left-12 w-56 h-56 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.darker, opacity: 0.25 }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.04) }} />
    <div className="max-w-6xl mx-auto px-6 relative z-10">
      <div className="text-center mb-16">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: theme.colors.primary.lighter }}>
          Everything You Need
        </p>
        <h2 className="text-4xl font-bold font-serif mb-4" style={{ color: theme.colors.secondary.cream }}>
          Built for Therapists
        </h2>
        <p className="max-w-xl mx-auto text-base" style={{ color: withAlpha(theme.colors.secondary.cream, 0.75) }}>
          Every feature is thoughtfully crafted around the real workflows of private practice therapists.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: '📅', title: 'Smart Scheduling', desc: 'Book sessions, send reminders, never miss an appointment.' },
          { icon: '👤', title: 'Client Records', desc: 'Secure, GDPR-compliant profiles with notes and history.' },
          { icon: '💳', title: 'Stripe Payments', desc: 'Send payment links, generate invoices, track balances.' },
          { icon: '📝', title: 'Session Notes', desc: 'SOAP, DAP, BIRP, and PIP templates that auto-save to profiles.' },
          { icon: '📊', title: 'Revenue Reports', desc: 'Clear picture of practice income week by week.' },
          { icon: '🔔', title: 'Reminders', desc: 'Get notified for missing notes and unpaid sessions.' },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl p-8 border transition-transform hover:shadow-xl" style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.08), borderColor: withAlpha(theme.colors.gray[50], 0.15) }}>
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-bold mb-2" style={{ color: theme.colors.secondary.cream }}>
              {f.title}
            </h3>
            <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.cream, 0.7) }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── About Section ─── */
const About = () => (
  <section id="about" className="py-24 relative overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream }}>
    {/* Circles */}
    <div className="absolute top-12 -right-12 w-52 h-52 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.lighter, opacity: 0.5 }} />
    <div className="absolute bottom-12 -left-12 w-52 h-52 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.45 }} />
    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: theme.colors.primary.DEFAULT }}>
        About TherapEase
      </p>
      <h2 className="text-4xl font-bold font-serif mb-6" style={{ color: theme.colors.secondary.charcoal }}>
        Built to give therapists<br />
        <em className="font-serif italic" style={{ color: theme.colors.primary.DEFAULT }}>their time back</em>
      </h2>
      <p className="max-w-2xl mx-auto mb-12 text-base leading-relaxed" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
        TherapEase was created after seeing how much time therapists lose each week to scheduling, chasing payments, and managing paperwork. We built one calm, focused tool that handles all of it.
      </p>

      <div className="bg-white rounded-3xl p-10 border shadow-sm" style={{ borderColor: theme.colors.secondary.beige }}>
        <p className="font-serif text-lg italic mb-4" style={{ color: theme.colors.secondary.charcoal }}>
          "TherapEase freed up hours each week I was spending on admin. Now I can focus entirely on my clients. The payment links alone have transformed how I run my practice."
        </p>
        <p className="font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
          Aoife Lynch — Psychotherapist, Dublin
        </p>
      </div>
    </div>
  </section>
);

/* ─── Contact Section ─── */
const Contact = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
      {/* Circles */}
      <div className="absolute top-16 -left-16 w-60 h-60 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.darker, opacity: 0.35 }} />
      <div className="absolute bottom-16 -right-16 w-60 h-60 rounded-full pointer-events-none" style={{ backgroundColor: theme.colors.primary.light, opacity: 0.25 }} />
      <div className="max-w-xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: theme.colors.primary.lighter }}>
            Get In Touch
          </p>
          <h2 className="text-3xl font-bold font-serif" style={{ color: theme.colors.secondary.cream }}>
            Have a question?
          </h2>
        </div>

        {sent ? (
          <div className="rounded-2xl p-8 text-center border" style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.07), borderColor: withAlpha(theme.colors.gray[50], 0.15) }}>
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-serif font-semibold mb-2" style={{ color: theme.colors.secondary.cream }}>
              Message sent!
            </p>
            <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.cream, 0.6) }}>
              We'll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-8 border" style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.1), borderColor: withAlpha(theme.colors.gray[50], 0.25) }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none" placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ borderColor: withAlpha(theme.colors.gray[50], 0.35), backgroundColor: withAlpha(theme.colors.gray[50], 0.15), color: theme.colors.secondary.cream }} />
              <input className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none" type="email" placeholder="Your email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ borderColor: withAlpha(theme.colors.gray[50], 0.35), backgroundColor: withAlpha(theme.colors.gray[50], 0.15), color: theme.colors.secondary.cream }} />
              <textarea className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none" placeholder="How can we help?" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ borderColor: withAlpha(theme.colors.gray[50], 0.35), backgroundColor: withAlpha(theme.colors.gray[50], 0.15), color: theme.colors.secondary.cream }} />
              <button
                type="submit"
                className="w-full py-3 font-medium rounded-lg text-sm transition-all duration-150"
                style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.2), color: theme.colors.secondary.cream, border: `1px solid ${withAlpha(theme.colors.gray[50], 0.35)}` }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = withAlpha(theme.colors.gray[50], 0.32); e.currentTarget.style.borderColor = withAlpha(theme.colors.gray[50], 0.55); }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = withAlpha(theme.colors.gray[50], 0.2); e.currentTarget.style.borderColor = withAlpha(theme.colors.gray[50], 0.35); }}
                onMouseDown={e => { e.currentTarget.style.backgroundColor = withAlpha(theme.colors.gray[50], 0.45); }}
                onMouseUp={e => { e.currentTarget.style.backgroundColor = withAlpha(theme.colors.gray[50], 0.32); }}
              >
                Send Message
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-10 border-t" style={{ backgroundColor: theme.colors.secondary.cream, borderColor: withAlpha(theme.colors.primary.lighter, 0.15) }}>
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <Logo />
      <p className="text-xs" style={{ color: theme.colors.primary.DEFAULT }}>
        © {new Date().getFullYear()} TherapEase. All rights reserved.
      </p>
      <div className="flex gap-6">
        {['Privacy', 'Terms', 'Contact'].map(item => (
          <a key={item} href="#" className="text-xs transition-colors hover:text-white" style={{ color: theme.colors.primary.DEFAULT }}>
            {item}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

/* ─── Page ─── */
export const LandingPage = () => (
  <>
    <Navbar />
    <Hero />
    <Features />
    <About />
    <Contact />
    <Footer />
  </>
);