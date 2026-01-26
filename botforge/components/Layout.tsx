import React, { useState } from 'react';
import { Bot, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isLoggedIn,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navClass = (path: string) =>
    `cursor-pointer hover:text-blue-600 transition-colors ${currentPath === path ? 'text-blue-600 font-semibold' : 'text-gray-600'}`;

  const handleNavClick = (id: string) => {
    if (currentPath === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link
              className="flex items-center gap-2 cursor-pointer"
              to="/"
            >
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BotForge</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <span className="cursor-pointer hover:text-blue-600 text-gray-600 transition-colors" onClick={() => handleNavClick('features')}>Features</span>
              <span className="cursor-pointer hover:text-blue-600 text-gray-600 transition-colors" onClick={() => handleNavClick('testimonials')}>Testimonials</span>
              <Link className={navClass('/pricing')} to="/pricing">Pricing</Link>
              <Link className={navClass('/faq')} to="/faq">FAQ</Link>

              {!isLoggedIn ? (
                <Link
                  to="/login"
                  className="text-gray-900 font-medium hover:text-blue-600"
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={onLogout}
                  className="text-gray-900 font-medium hover:text-blue-600"
                >
                  Logout
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-4 px-4 space-y-4">
            <div className="block py-2 text-gray-600" onClick={() => handleNavClick('features')}>Features</div>
            <div className="block py-2 text-gray-600" onClick={() => handleNavClick('testimonials')}>Testimonials</div>
            <Link className="block py-2 text-gray-600" to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link className="block py-2 text-gray-600" to="/faq" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <Link className="block py-2 font-medium text-blue-600" to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Bot className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500 font-semibold">BotForge</span>
            </div>
            <p className="text-gray-400 text-sm">© 2024 BotForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};