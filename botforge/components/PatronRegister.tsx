import React, { useState } from 'react';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import { publicService } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export const PatronRegister: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await publicService.registerPatron(form);
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch {
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md w-full border border-gray-200">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Check your email</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email before logging in.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>

          <div className="mt-4 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full border border-gray-200">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Join as Patron</span>
        </div>

        <p className="text-center text-gray-500 text-sm mb-6">
          Create an account to explore and chat with available bots.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded flex items-center gap-2 mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. owenkevin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

