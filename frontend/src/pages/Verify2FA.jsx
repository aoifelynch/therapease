import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { twoFactorAPI } from '../api/api';

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
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="error-message mb-6">Invalid 2FA session. Please log in again.</div>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full">
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
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Two-Factor Authentication</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Enter the code from your authenticator app</p>

        {error && <div className="error-message">{error}</div>}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">Verifying as: <strong className="text-gray-900">{user?.email}</strong></p>
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
              className="text-center text-2xl tracking-widest"
            />
            <small className="text-gray-500 text-xs block mt-1">Enter the 6-digit code from your authenticator app</small>
          </div>

          <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="btn btn-secondary w-full mt-3"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};
