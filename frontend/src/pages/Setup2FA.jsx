import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { twoFactorAPI } from '../api/api';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { getFormErrorMessage } from '../utils/errorMessages';

export const Setup2FA = () => {
  const [step, setStep] = useState('start');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const handleStartSetup = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await twoFactorAPI.setup();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setStep('display');
    } catch (err) {
      setError(getFormErrorMessage(err, 'Unable to start 2FA setup'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await twoFactorAPI.verifySetup(code);
      updateUser(response.user);
      navigate('/dashboard', { state: { success: '2FA has been enabled on your account!' } });
    } catch (err) {
      setError(getFormErrorMessage(err, 'Unable to verify setup code'));
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

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-medium mb-1"
            style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.charcoal }}
          >
            Enable two-factor authentication
          </h1>
          <p className="text-sm" style={{ color: theme.colors.gray[400], fontFamily: theme.fonts.serif }}>
            Protect your account with an authenticator app
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

        {step === 'start' && (
          <>
            <p className="mb-6 text-center text-sm leading-relaxed" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72), fontFamily: theme.fonts.serif }}>
              Secure your account with two-factor authentication. You'll need an authenticator app like Google Authenticator or Microsoft Authenticator.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 mb-3"
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
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
            <button
              onClick={logout}
              className="w-full py-4 rounded-xl font-medium text-sm transition-all duration-200"
              style={{
                backgroundColor: theme.colors.gray[50],
                color: theme.colors.secondary.charcoal,
                border: `1px solid ${theme.colors.secondary.beige}`,
                fontFamily: theme.fonts.serif,
              }}
            >
              Log Out
            </button>
          </>
        )}

        {step === 'display' && (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.charcoal }}>Step 1: Scan QR code</h3>
                <p className="mb-4 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72), fontFamily: theme.fonts.serif }}>Open your authenticator app and scan this QR code:</p>

                <div className="mb-4 flex justify-center rounded-lg border p-4" style={{ backgroundColor: theme.colors.gray[50], borderColor: theme.colors.secondary.beige }}>
                  <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
                </div>

                <p className="mb-2 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72), fontFamily: theme.fonts.serif }}>Or enter this code manually:</p>
                <div className="rounded-lg border p-3" style={{ backgroundColor: theme.colors.gray[50], borderColor: theme.colors.secondary.beige }}>
                  <code className="block break-all text-center text-sm font-mono" style={{ color: theme.colors.secondary.charcoal }}>{secret}</code>
                </div>
              </div>

              <div className="border-t pt-6" style={{ borderColor: theme.colors.secondary.beige }}>
                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: theme.fonts.serif, color: theme.colors.secondary.charcoal }}>Step 2: Verify your code</h3>
                <p className="mb-4 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72), fontFamily: theme.fonts.serif }}>Enter the 6-digit code from your authenticator app:</p>

                <form onSubmit={handleVerifySetup} className="space-y-4">
                  <div className="form-group">
                    <input
                      type="text"
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
                    {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setStep('start');
                    setQrCode('');
                    setSecret('');
                    setCode('');
                    setError('');
                  }}
                  className="w-full py-4 rounded-xl font-medium text-sm transition-all duration-200 mt-3"
                  style={{
                    backgroundColor: theme.colors.gray[50],
                    color: theme.colors.secondary.charcoal,
                    border: `1px solid ${theme.colors.secondary.beige}`,
                    fontFamily: theme.fonts.serif,
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
