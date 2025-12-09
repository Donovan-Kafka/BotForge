import React, { useState } from 'react';
import { PageView } from '../types';
import { Bot, Check } from 'lucide-react';

interface AuthProps {
  view: PageView;
  onNavigate: (page: PageView) => void;
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ view, onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    company: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      onNavigate(PageView.ACTIVATED);
    }, 500);
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
          <div>
            <label className="block text-gray-700 font-medium mb-2">Username:</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" 
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
            />
            <div className="text-right mt-1">
              <button type="button" className="text-gray-600 text-sm hover:text-blue-600">Forgot password? Reset</button>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button type="submit" className="bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors">
              Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Register View
  if (view === PageView.REGISTER) {
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
          <div>
            <label className="block text-gray-700 font-medium mb-1">Username:</label>
            <input type="text" className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password:</label>
            <input type="password" className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Confirm Password:</label>
            <input type="password" className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Email:</label>
            <input type="email" className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Company:</label>
            <input type="text" className="w-full border-2 border-gray-400 rounded p-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="flex justify-center pt-6">
            <button type="submit" className="bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors">
              Register Now
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Account Activated View
  if (view === PageView.ACTIVATED) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">BotForge</span>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-12">Account Activated</h2>
        
        <div className="text-center mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hi John,</h3>
          <p className="text-gray-800 text-lg mb-2">Thank you, your email has been verified.</p>
          <p className="text-gray-800 text-lg mb-2">Your account has been activated.</p>
          <p className="text-gray-800 text-lg">Login to get started.</p>
        </div>

        <button 
          onClick={() => onNavigate(PageView.LOGIN)} 
          className="bg-white border-2 border-gray-600 text-gray-800 font-bold py-2 px-8 rounded hover:bg-gray-50 transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return null;
};