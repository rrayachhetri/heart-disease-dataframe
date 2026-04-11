import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard';
import PredictPage from './pages/Predict';
import ResultPage from './pages/Result';
import HistoryPage from './pages/History';
import DoctorProfilePage from './pages/DoctorProfile';
import SessionTimeoutPage from './pages/SessionTimeout';
import SystemUnavailablePage from './pages/SystemUnavailable';
import SessionWarningBanner from './components/Session/SessionWarningBanner';
import { useAppSelector } from './store/hooks';

/** Watches system.unavailable and navigates to /system-unavailable when API is down. */
function SystemRedirect() {
  const unavailable = useAppSelector((s) => s.system.unavailable);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (unavailable && location.pathname !== '/system-unavailable') {
      navigate('/system-unavailable', { replace: true });
    }
  }, [unavailable, navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <SystemRedirect />
      <SessionWarningBanner />

      <Routes>
        {/* Public auth routes — no Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public status pages */}
        <Route path="/session-timeout" element={<SessionTimeoutPage />} />
        <Route path="/system-unavailable" element={<SystemUnavailablePage />} />

        {/* Protected app routes — wrapped in Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/predict" element={<PredictPage />} />
                  <Route path="/result" element={<ResultPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
