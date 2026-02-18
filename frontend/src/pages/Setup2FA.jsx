import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { twoFactorAPI } from '../api/api';

export const Setup2FA = () => {
  const [step, setStep] = useState('start'); // start, display, verify
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const handleStartSetup = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await twoFactorAPI.setup(accessToken);
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setStep('display');
    } catch (err) {
      setError(err.message);
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
      await twoFactorAPI.verifySetup(code, accessToken);
      navigate('/dashboard', { state: { success: '2FA has been enabled on your account!' } });
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
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Enable Two-Factor Authentication</h1>

        {error && <div className="error-message">{error}</div>}

        {step === 'start' && (
          <>
            <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed">
              Secure your account with two-factor authentication. You'll need an authenticator app like Google Authenticator or Authy.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="btn btn-primary w-full mb-3"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary w-full"
            >
              Cancel
            </button>
          </>
        )}

        {step === 'display' && (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Scan QR Code</h3>
                <p className="text-gray-600 text-sm mb-4">Open your authenticator app and scan this QR code:</p>

                <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
                </div>

                <p className="text-gray-600 text-sm mb-2">Or enter this code manually:</p>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-sm font-mono text-center block text-gray-900 break-all">{secret}</code>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Verify Your Code</h3>
                <p className="text-gray-600 text-sm mb-4">Enter the 6-digit code from your authenticator app:</p>

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
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="btn btn-primary w-full"
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
                  className="btn btn-secondary w-full mt-3"
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
