import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { FAQPage } from './components/FAQPage';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { SystemAdminDashboard } from './components/SystemAdminDashboard';
import { PageView, User } from './types';
import { authService } from './api';
import CreateCompanyProfile from './components/organisational-admin/CreateCompanyProfile/CreateCompanyProfile';

// Wrapper to handle token verification and redirect
const TokenHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Remove token from URL
      navigate(location.pathname, { replace: true });

      authService.verifyEmail(token).then((res) => {
        if (res.ok) {
          navigate('/activated');
        } else {
          console.error("Verification failed:", res.error);
          navigate('/login');
        }
      });
    }
  }, [location, navigate]);

  return null;
};

// Layout Wrapper to pass props to Layout and render Outlet
const LayoutWrapper = ({ isLoggedIn, onLogout }: { isLoggedIn: boolean, onLogout: () => void }) => {
  return (
    <Layout isLoggedIn={isLoggedIn} onLogout={onLogout}>
      <Outlet />
    </Layout>
  );
};

function AppContent({ user, setUser, handleLoginSuccess }: { user: User | null, setUser: (u: User | null) => void, handleLoginSuccess: (u: User) => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  // Check for admin role
  const isAdmin = user && (user.username === 'SystemAdmin' || user.role_id === 0 || user.system_role_id === 0);

  return (
    <>
      <TokenHandler />
      <Routes>
        <Route element={<LayoutWrapper isLoggedIn={!!user} onLogout={handleLogout} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage user={user} />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/login" element={<Auth view={PageView.LOGIN} onLoginSuccess={(u) => {
            handleLoginSuccess(u);
            const admin = u.username === 'SystemAdmin' || u.role_id === 0 || u.system_role_id === 0;
            if (admin) {
              navigate('/system-admin');
            } else if (u.organisation_id && u.organisation_id > 0) {
              navigate('/dashboard');
            } else {
              navigate('/create-profile');
            }
          }} />} />
          <Route path="/register" element={<Auth view={PageView.REGISTER} onLoginSuccess={() => { }} />} />
          <Route path="/activated" element={<Auth view={PageView.ACTIVATED} onLoginSuccess={() => navigate('/login')} />} />
        </Route>

        <Route path="/dashboard" element={
          user ? <Dashboard onLogout={handleLogout} onSystemAdminLogin={() => navigate('/system-admin')} user={user} /> : <Navigate to="/login" />
        } />

        <Route path="/system-admin" element={
          isAdmin ? <SystemAdminDashboard onLogout={handleLogout} onBackToDashboard={() => navigate('/dashboard')} /> : <Navigate to="/dashboard" />
        } />

        <Route path="/create-profile" element={
          user ? <CreateCompanyProfile onSuccess={() => navigate('/pricing')} /> : <Navigate to="/login" />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    console.log("[DEBUG] handleLoginSuccess user:", user);
    setUser(user);
  };

  return (
    <BrowserRouter>
      <AppContent user={user} setUser={setUser} handleLoginSuccess={handleLoginSuccess} />
    </BrowserRouter>
  );
}
