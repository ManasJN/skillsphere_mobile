import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';
import BrandLogo from './components/brand/BrandLogo';

// Pages
import { Login, Register } from './pages/Auth';
import Landing from './pages/Landing';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard    from './pages/student/Dashboard';
import SkillsGoals  from './pages/student/Skills';
import Projects     from './pages/student/Projects';
import Profile      from './pages/student/Profile';
import Recommendations from './pages/student/Recommendations';
import CollegeDashboard from './pages/college/CollegeDashboard';
import AdminDashboard   from './pages/staff/AdminDashboard';
import Leaderboard   from './pages/shared/Leaderboard';
import Opportunities from './pages/shared/Opportunities';
import Notifications from './pages/shared/Notifications';
import Analytics     from './pages/shared/Analytics';
import Settings      from './pages/shared/Settings';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#060d1f] gap-4">
    <BrandLogo compact />
    <Spinner size={28} />
  </div>
);

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const getDashboardPath = (role) => (
  role === 'student' ? '/dashboard' : role === 'college' ? '/college' : '/internal/admin'
);

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
  return <Landing />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
  return children;
};

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#030b1d] gap-4 text-center px-6">
    <p className="text-[#64748b] text-sm uppercase tracking-wide">404</p>
    <h1 className="text-2xl font-bold text-white">Page not found</h1>
    <a href="/" className="text-[#93c5fd] hover:underline text-sm mt-2">Back to home</a>
  </div>
);

const toastOptions = {
  style: { background:'#0b1630', color:'#f1f5f9', border:'1px solid #1e2d4a', fontSize:13, fontFamily:"'Space Grotesk',sans-serif", borderRadius:10 },
  success: { iconTheme: { primary:'#10b981', secondary:'#0b1630' } },
  error:   { iconTheme: { primary:'#ef4444', secondary:'#0b1630' } },
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={toastOptions} />
        <Routes>
          <Route path="/"         element={<HomeRoute />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>}  />

          <Route path="/dashboard" element={<PrivateRoute roles={['student']}><Dashboard /></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute roles={['student']}><Profile /></PrivateRoute>} />
          <Route path="/skills"    element={<PrivateRoute roles={['student']}><SkillsGoals /></PrivateRoute>} />
          <Route path="/projects"  element={<PrivateRoute roles={['student']}><Projects /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute roles={['student']}><Recommendations /></PrivateRoute>} />

          <Route path="/college"  element={<PrivateRoute roles={['college']}><CollegeDashboard /></PrivateRoute>} />
          <Route path="/students" element={<PrivateRoute roles={['college']}><CollegeDashboard /></PrivateRoute>} />
          <Route path="/internal/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

          <Route path="/leaderboard"   element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/opportunities" element={<PrivateRoute><Opportunities /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/analytics"     element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/settings"      element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
