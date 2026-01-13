import React from 'react';
import { PageView, Testimonial } from '../types';
import { Search, RotateCw, Settings, Play } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {

  const testimonials: Testimonial[] = [
    {
      quote: "The results we have seen with BotForge are groundbreaking, double-digit gains in engagement and resolution rates.",
      author: "Timothy Lim",
      role: "Head of Product Support, OpenAI"
    },
    {
      quote: "If you're still debating whether to build your own AI solution or buy one, my advice would be to buy - and specifically buy BotForge.",
      author: "Samantha Ong",
      role: "Head of HR Team, Shopee"
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-slate-500 relative overflow-hidden">
        {/* Abstract background elements if needed, keeping it simple to match wireframe style */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-90 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src="https://picsum.photos/800/600?grayscale"
                alt="BotForge Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="text-white space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Your all-in-one platform to create AI chatbots that deliver results
              </h1>
              <p className="text-blue-100 text-lg">
                Build, train, and deploy intelligent agents in minutes. No coding required.
              </p>
              <button
                onClick={() => onNavigate(PageView.REGISTER)}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded shadow-lg transition-all transform hover:scale-105"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Features</h2>
            <p className="text-gray-600 text-lg">Forge the ultimate bot for your own needs.</p>
          </div>

          {/* Video Placeholder */}
          <div className="max-w-4xl mx-auto mb-20 bg-black rounded-lg aspect-video flex items-center justify-center relative shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all">
                <Play className="h-12 w-12 text-white fill-white" />
              </div>
            </div>
            <span className="absolute bottom-4 right-4 text-white font-mono bg-black/50 px-2 py-1 rounded">6:34 AM</span>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Analyze */}
            <div className="bg-blue-100/50 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Search className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gain deep insights into customer conversations with real-time analytics.
              </p>
            </div>

            {/* Train */}
            <div className="bg-blue-100/50 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <RotateCw className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Train</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Continuously improve your bot with smart, adaptive learning workflows.
              </p>
            </div>

            {/* Customize */}
            <div className="bg-blue-100/50 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Settings className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customize</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Easily tailor every aspect of your chatbot to match your brand identity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Testimonials</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-100 p-8 rounded border border-gray-300 relative">
                <div className="text-6xl text-gray-300 font-serif absolute top-4 left-6">“</div>
                <p className="text-gray-800 mb-6 relative z-10 pt-4 text-lg font-medium leading-relaxed">
                  {t.quote}
                </p>
                <div className="text-sm text-gray-500 border-t border-gray-300 pt-4">
                  <span className="font-bold text-gray-700">{t.author}</span>, {t.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};