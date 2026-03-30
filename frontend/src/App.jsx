import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Verify2FA } from './pages/Verify2FA';
import { Setup2FA } from './pages/Setup2FA';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { ClientList } from './pages/ClientList';
import { ClientProfile } from './pages/ClientProfile';
import { LandingPage } from './pages/Landing';
// import { Payments } from './pages/Payments';
// import { PaymentSuccess } from './pages/PaymentSuccess';
// import { PaymentCancelled } from './pages/PaymentCancelled';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/2fa-verify" element={<Verify2FA />} />
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} /> */}
          <Route
            path="/setup-2fa"
            element={
              <ProtectedRoute>
                <Setup2FA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientList />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
