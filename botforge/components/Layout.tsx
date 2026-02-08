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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-sm z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link
              className="flex items-center gap-2 cursor-pointer group"
              to="/"
            >
              <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">BotForge</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-all" onClick={() => handleNavClick('features')}>Features</button>
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-all" onClick={() => handleNavClick('testimonials')}>Testimonials</button>
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-all" onClick={() => handleNavClick('pricing')}>Pricing</button>
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-all" onClick={() => handleNavClick('faq')}>FAQ</button>

              <div className="w-px h-6 bg-slate-200 mx-2"></div>

              {!isLoggedIn ? (
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={onLogout}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Logout
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl rounded-b-2xl py-4 px-4 space-y-2 absolute top-full left-0 right-0 mt-2 shadow-xl animate-in slide-in-from-top-4 fade-in duration-200">
            <button className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors" onClick={() => handleNavClick('features')}>Features</button>
            <button className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors" onClick={() => handleNavClick('testimonials')}>Testimonials</button>
            <button className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors" onClick={() => handleNavClick('pricing')}>Pricing</button>
            <button className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors" onClick={() => handleNavClick('faq')}>FAQ</button>
            <div className="h-px bg-slate-100 my-2"></div>
            <Link className="block w-full text-center py-3 font-semibold text-white bg-blue-600 rounded-xl shadow-md active:scale-95 transition-all" to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24 md:pt-28">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-100">BotForge</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <Link to="#" className="hover:text-blue-400 transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-blue-400 transition-colors">Terms</Link>
              <Link to="#" className="hover:text-blue-400 transition-colors">Contact</Link>
            </div>
            <p className="text-slate-500 text-sm">© 2026 BotForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};