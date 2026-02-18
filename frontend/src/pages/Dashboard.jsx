import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (location.state?.success) {
      setSuccessMessage(location.state.success);
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate, location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TherapEase Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary">
            Log Out
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h2>
          <p className="text-gray-600 mt-1">Email: {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Security Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Security</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Two-Factor Authentication</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.twoFactorEnabled ? '✓ Enabled' : 'Not Enabled'}
                </span>
              </div>

              {!user.twoFactorEnabled && (
                <p className="text-gray-600 text-sm">
                  Enable 2FA to add an extra layer of security to your account.
                </p>
              )}

              <button
                onClick={() => navigate('/setup-2fa')}
                className="btn btn-primary w-full mt-4"
              >
                {user.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-700">Clients</span>
                <span className="text-2xl font-bold text-primary">0</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-700">Appointments</span>
                <span className="text-2xl font-bold text-primary">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Notes</span>
                <span className="text-2xl font-bold text-primary">0</span>
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">Name:</strong>
                <p className="text-gray-600">{user.name}</p>
              </div>
              <div>
                <strong className="text-gray-700">Email:</strong>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div>
                <strong className="text-gray-700">User ID:</strong>
                <code className="block bg-gray-100 p-2 rounded text-xs text-gray-600 mt-1 break-all">{user.id}</code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
