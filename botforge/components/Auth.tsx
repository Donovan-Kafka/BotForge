import React, { useEffect, useState } from 'react';
import { PageView, User } from '../types';
import { Bot, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';


interface AuthProps {
  view: PageView;
  onLoginSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    company: '',
    industry: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

  useEffect(() => {
  if (view !== PageView.ACTIVATED) return;

    setVerifyOk(null);
    
    const token = searchParams.get('token');
    if (!token) {
      setVerifyOk(false);
      return;
    }

    (async () => {
      const res = await authService.verifyEmail(token);
      setVerifyOk(res.ok === true);
    })();
  }, [view, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login({
        // Using username as identifier for now, backend supports email too
        password: formData.password,
        identifier: formData.username // Send both or map to identifier
      });

      if (res.ok && res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.register({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        email: formData.email,
        company: formData.company,
        industry: formData.industry || 'Other'
      });

      if (res.ok) {
        setShowSuccessMessage(true);
        if (res.verify_token) setVerifyToken(res.verify_token);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Login View
  if (view === PageView.LOGIN) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">BotForge</span>
        </div>

        <h2 className="text-3xl font-normal text-gray-800 mb-12">Sign In</h2>

        <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Username or Email:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
            <div className="text-right mt-1">
              <button type="button" className="text-gray-600 text-sm hover:text-blue-600">Forgot password? Reset</button>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Register View
  if (view === PageView.REGISTER) {
    if (showSuccessMessage) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
              <p>Please check your email ({formData.email}) to verify your account.</p>
              {/* DEV ONLY: Show verification link */}
              {verifyToken && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-sm break-all">
                  <strong>Dev Link:</strong> <a href={`/activated?token=${verifyToken}`} target="_blank" rel="noreferrer" className="underline">Verify Now</a>
                </div>
              )}
            </div>
            <Link
              to="/login"
              className="text-blue-600 underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">BotForge</span>
        </div>

        <h2 className="text-3xl font-normal text-gray-800 mb-10">Register</h2>

        <form onSubmit={handleRegister} className="w-full max-w-md space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1">Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Company:</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Industry:</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="">Select Industry</option>
              <option value="F&B">F&B</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              Register Now
            </button>
          </div>
        </form>
      </div>
    );
  }
  // Account Activated View (Redirected after email verification)
  if (view === PageView.ACTIVATED) {
    if (verifyOk === null) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-6 w-6 text-gray-700" />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">BotForge</span>
        </div>

        {verifyOk ? (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hello!</h3>
            <p className="text-gray-800 text-lg mb-2">Thank you, your email has been verified.</p>
            <p className="text-gray-800 text-lg mb-2">Your account has been activated.</p>
            <p className="text-gray-800 text-lg">Login to get started.</p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-red-600 mb-4">Verification failed</h3>
            <p className="text-gray-800 text-lg mb-2">
              This verification link is invalid or expired.
            </p>
          </>
        )}

        <Link
          to="/login"
          className="mt-10 bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors"
        >
          Login
        </Link>
      </div>
    );
  }

  return null;
};


  