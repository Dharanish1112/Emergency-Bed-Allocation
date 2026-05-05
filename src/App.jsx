import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GoogleSheetsAuth from './components/GoogleSheetsAuth';
import ExcelAuth from './components/ExcelAuth';
import SimpleExcelAuth from './components/SimpleExcelAuth';
import VoiceBooking from './components/VoiceBooking';
import Login from './pages/Login';
import Ambulance from './pages/Ambulance';
import Hospital from './pages/Hospital';
import Admin from './pages/Admin';

// Returns the stored user object or null
function getStoredUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Generic auth guard — just checks if logged in
function ProtectedRoute({ children }) {
  const user = getStoredUser();
  return user ? children : <Navigate to="/login" replace />;
}

// Role-specific guard — redirects to correct dashboard if wrong role
function RoleRoute({ role, children }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Redirect to their actual dashboard
    const routes = { admin: '/admin', hospital: '/hospital', driver: '/ambulance' };
    return <Navigate to={routes[user.role] || '/login'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Role-protected routes */}
        <Route
          path="/admin"
          element={
            <RoleRoute role="admin">
              <Admin />
            </RoleRoute>
          }
        />
        <Route
          path="/hospital"
          element={
            <RoleRoute role="hospital">
              <Hospital />
            </RoleRoute>
          }
        />
        <Route
          path="/ambulance"
          element={
            <RoleRoute role="driver">
              <Ambulance />
            </RoleRoute>
          }
        />
        <Route
          path="/voice-booking"
          element={
            <RoleRoute role="driver">
              <VoiceBooking />
            </RoleRoute>
          }
        />

        {/* Catch-all: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
