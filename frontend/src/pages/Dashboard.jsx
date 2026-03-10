import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, clientsAPI } from '../api/api';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');

        const [appointmentsResponse, clientsResponse] = await Promise.all([
          appointmentsAPI.getAll(),
          clientsAPI.getAll()
        ]);

        setAppointments(appointmentsResponse.data || []);
        setClientCount(clientsResponse.data?.length || 0);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
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
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-700">Clients</span>
                  <span className="text-2xl font-bold text-primary">{clientCount}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-700">Appointments</span>
                  <span className="text-2xl font-bold text-primary">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Notes</span>
                  <span className="text-2xl font-bold text-primary">0</span>
                </div>
              </div>
            )}
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

        {/* Appointments List */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Appointments</h3>
          {loading ? (
            <div className="card text-center py-8 text-gray-500">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              No appointments scheduled yet.
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.date ? (
                            <>
                              {new Date(appointment.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                              {appointment.startTime && ` at ${appointment.startTime}`}
                            </>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.client?.firstName || 'N/A'} {appointment.client?.lastName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Edit | Delete
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
