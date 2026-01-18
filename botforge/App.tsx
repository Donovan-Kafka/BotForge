import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { FAQPage } from './components/FAQPage';
import { Auth } from './components/Auth';
// Payment is now imported inside Dashboard, not here
import { Dashboard } from './components/Dashboard';
import { SystemAdminDashboard } from './components/SystemAdminDashboard';
import { PageView, User } from './types';

import { authService } from './api';
import CreateCompanyProfile from './components/organisational-admin/CreateCompanyProfile/CreateCompanyProfile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const isLoggedIn = !!user;

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Remove token from URL so it doesn't persist
      window.history.replaceState({}, '', window.location.pathname);

      authService.verifyEmail(token).then((res) => {
        if (res.ok) {
          setCurrentPage(PageView.ACTIVATED);
        } else {
          // Handle error if needed, maybe show a toast or alert
          console.error("Verification failed:", res.error);
          setCurrentPage(PageView.LOGIN); // Or stay on landing?
        }
      });
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    const isAdmin = user.username === 'SystemAdmin' || user.role_id === 0;
    if (isAdmin) {
      setCurrentPage(PageView.SYSTEM_ADMIN);
    } else {
      setCurrentPage(PageView.CREATE_PROFILE);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage(PageView.LOGIN);
  };

  return (
    <>
      {currentPage === PageView.SYSTEM_ADMIN ? (
        <SystemAdminDashboard
          onLogout={handleLogout}
          onBackToDashboard={() => setCurrentPage(PageView.DASHBOARD)}
        />
      ) : (
        currentPage === PageView.CREATE_PROFILE ? (
             <CreateCompanyProfile 
                onSuccess={() => setCurrentPage(PageView.PRICING)} 
             />
        ) : (
        <Layout
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        >
          {currentPage === PageView.LANDING && <LandingPage onNavigate={setCurrentPage} />}
          {currentPage === PageView.PRICING && (
                  <PricingPage 
                    onNavigate={setCurrentPage} 
                    user={user} 
                    onSuccess={() => setCurrentPage(PageView.DASHBOARD)}
                  />
              )}
              
              {currentPage === PageView.FAQ && <FAQPage />}

              {(currentPage === PageView.LOGIN ||
                currentPage === PageView.REGISTER ||
                currentPage === PageView.ACTIVATED) && (
                  <Auth
                    view={currentPage}
                    onNavigate={setCurrentPage}
                    onLoginSuccess={handleLoginSuccess}
                  />
                )}

              {currentPage === PageView.DASHBOARD && isLoggedIn && (
                <Dashboard
                  onLogout={handleLogout}
                  onSystemAdminLogin={() => setCurrentPage(PageView.SYSTEM_ADMIN)}
                  user={user}
                />
              )}
            </Layout>
        )
      )}
    </>
  );
}
    </>
  );
}
