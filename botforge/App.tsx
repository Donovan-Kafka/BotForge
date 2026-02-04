import React, { useState } from 'react';
import { useEffect } from "react";
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
import { ChatPage } from './components/ChatPage';
import { SelectChat } from './components/SelectChat';
import { PatronRegister } from './components/PatronRegister';
import { OperatorRegister } from './components/OperatorRegister';

// Wrapper to handle token verification and redirect
const TokenHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname !== "/activated") return;   //prevents breaking of operator invites

    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) return;

    // Remove token from URL
    navigate(location.pathname, { replace: true });

    authService.verifyEmail(token).then((res) => {
      if (res.ok) {
        navigate("/activated");
      } else {
        console.error("Verification failed:", res.error);
        navigate("/login");
      }
    });
  }, [location.pathname, location.search, navigate]);

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
    localStorage.removeItem('user'); // Clear storage on logout
    navigate('/login');
  };

  // Check for admin role
  const isSysAdmin = user?.system_role_id === 0;
  const isOrgUser = user?.system_role_id === 1;
  const isPatron = user?.system_role_id === 2;

  return (
    <>
      <TokenHandler />
      <Routes>
        <Route element={<LayoutWrapper isLoggedIn={!!user} onLogout={handleLogout} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage user={user} />} />
          <Route path="/faq" element={<FAQPage />} />
          {/* <Route path="/login" element={<Auth view={PageView.LOGIN} onLoginSuccess={(u) => {
            handleLoginSuccess(u);

            // REDIRECTION LOGIC START
            const admin = u.username === 'SystemAdmin' || u.role_id === 0 || u.system_role_id === 0;

            if (admin) {
              navigate('/system-admin');
            } else if (u.organisation_id && u.organisation_id > 0) {
              // If user already belongs to an organization
              if (!u.is_profile_complete) {
                navigate('/create-profile');
              } else if (!u.subscription_id || u.subscription_id <= 0) {
                navigate('/dashboard?tab=subscription');
              } else {
                navigate('/dashboard');
              }
            } else {
              // NEW CHANGE: If no organisation_id (new user), force redirect to profiling
              navigate('/create-profile');
            }
            // REDIRECTION LOGIC END
          }} />} /> */}
          <Route
            path="/login"
            element={
              <Auth
                view={PageView.LOGIN}
                onLoginSuccess={(u) => {
                  handleLoginSuccess(u);

                  // role-based redirect
                  const sysRole = u.system_role_id;

                  if (sysRole === 0) {
                    navigate('/system-admin');
                    return;
                  }

                  if (sysRole === 2) {
                    navigate('/selectChat');
                    return;
                  }

                  if (!u.organisation_id || u.organisation_id <= 0) {
                    // should not happen for sysRole=1 due to DB constraint, but safe fallback
                    navigate('/login');
                    return;
                  }

                  if (!u.is_profile_complete) {
                    navigate('/create-profile');
                  } else if (!u.subscription_id || u.subscription_id <= 0) {
                    navigate('/dashboard?tab=subscription');
                  } else {
                    navigate('/dashboard');
                  }
                }}
              />
            }
          />
          <Route path="/selectChat" element={
            user && user.system_role_id === 2 ? <SelectChat /> : <Navigate to="/login" />
          } />
          <Route path="/register" element={<Auth view={PageView.REGISTER} onLoginSuccess={() => { }} />} />
          <Route path="/activated" element={<Auth view={PageView.ACTIVATED} onLoginSuccess={() => navigate('/login')} />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            user && user.system_role_id === 1
              ? (user.is_profile_complete ? (
                  <Dashboard user={user} onLogout={handleLogout} onSystemAdminLogin={() => navigate('/system-admin')} />
                ) : (
                  <Navigate to="/create-profile" replace />
                ))
              : <Navigate to="/login" replace />
          }
        />

        <Route path="/system-admin" element={
          user && user.system_role_id === 0 ? <SystemAdminDashboard onLogout={handleLogout} onBackToDashboard={() => navigate('/dashboard')} user={user} /> : <Navigate to="/login" />
        } />

        <Route
          path="/create-profile"
          element={
            user && user.system_role_id === 1
              ? (!user.is_profile_complete ? (
                  <CreateCompanyProfile
                    onSuccess={() => {
                      if (!user) return;

                      const updatedUser = { ...user, is_profile_complete: true };
                      setUser(updatedUser);
                      localStorage.setItem('user', JSON.stringify(updatedUser));

                      // redirect to subscription selection
                      navigate('/dashboard?tab=subscription', { replace: true });
                    }}
                  />
                ) : (
                  <Navigate
                    to={
                      !user.subscription_id || user.subscription_id <= 0
                        ? "/dashboard?tab=subscription"
                        : "/dashboard"
                    }
                    replace
                  />
                ))
              : <Navigate to="/login" replace />
          }
        />


        <Route path="/chatPage" element={
            user && user.system_role_id === 2 ? <ChatPage user={user} /> : <Navigate to="/login" />
        }/>

        <Route path="/patron/register" element={ <PatronRegister />}/>

        <Route path="/operator-signup" element={ <OperatorRegister />} />


        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  // Initialize state from localStorage so the app remembers the user on refresh
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  // backend warm up (runs on site visit)
  const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE_URL;
  useEffect(() => {
    if (window.location.hostname === "localhost") return;
    fetch(`${BACKEND_BASE}/health`)
      .catch(() => {
        // Ignore errors - backend may be cold starting
      });
  }, []);

  return (
    <BrowserRouter>
      <AppContent
        user={user}
        setUser={setUser}
        handleLoginSuccess={handleLoginSuccess}
      />
    </BrowserRouter>
  );
}

