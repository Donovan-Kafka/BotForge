import React, { useState, useEffect } from 'react';
import { Testimonial } from '../types';
import { Search, RotateCw, Settings, Play, Star } from 'lucide-react';
import { featureService, publicService } from '../api';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<{ url: string; title: string; description: string; } | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      // Default to subscription_id 1 for generic landing page features
      const response = await featureService.getFeatures(1);
      if (response.features) {
        setFeatures(response.features);
      }
    };

    const fetchTestimonials = async () => {
      try {
        const response = await publicService.getTestimonials();
        if (response.ok && response.testimonials) {
          const mappedTestimonials: Testimonial[] = response.testimonials.map((t: any) => ({
            quote: t.content,
            author: t.author,
            role: t.role, // Note: This displays the system role (e.g. OrgAdmin).
            rating: t.rating
          }));
          setTestimonials(mappedTestimonials);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials", error);
      }
    };

    const fetchFeaturedVideo = async () => {
      try {
        const res = await publicService.getFeaturedVideo();
        if (res.ok && res.video) {
          setFeaturedVideo({
            url: res.video.url || "",
            title: res.video.title || "",
            description: res.video.description || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch featured video", error);
      }
    };


    fetchFeatures();
    fetchTestimonials();
    fetchFeaturedVideo();
  }, []);

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
              <Link
                to="/register"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded shadow-lg transition-all transform hover:scale-105 inline-block"
              >
                Register as an Organisation
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Patron Access Section */}
      <div className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Just here to chat with a bot?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Register as a patron to explore and interact with available chatbots.
          </p>

          <Link
            to="/patron/register"
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-10 rounded-lg shadow-md transition-all transform hover:scale-105"
          >
            Register as a Patron
          </Link>
        </div>
      </div>


      {/* Features Section */}
      <div id="features" className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Features</h2>
            <p className="text-gray-600 text-lg">Forge the ultimate bot for your own needs.</p>
          </div>

          {/* Featured Video */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-black rounded-lg aspect-video overflow-hidden shadow-2xl border border-black/10">
              {featuredVideo?.url ? (
                <iframe
                  className="w-full h-full"
                  src={featuredVideo.url}
                  title={featuredVideo.title || "Featured video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70">
                  No featured video set yet.
                </div>
              )}
            </div>

            {(featuredVideo?.title || featuredVideo?.description) && (
              <div className="text-center mt-4">
                {featuredVideo?.title && (
                  <h3 className="text-xl font-bold text-gray-900">{featuredVideo.title}</h3>
                )}
                {featuredVideo?.description && (
                  <p className="text-gray-600 mt-1">{featuredVideo.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              let Icon = Search;
              if (feature.name.includes("Train")) Icon = RotateCw;
              if (feature.name.includes("Customize")) Icon = Settings;

              return (
                <div key={feature.id} className="bg-blue-100/50 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="h-6 w-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
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
                <div className="text-6xl text-gray-300 font-serif absolute top-4 left-6">"</div>

                <p className="text-gray-800 mb-6 relative z-10 pt-2 text-lg font-medium leading-relaxed">
                  {t.quote}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-300 pt-4">
                  <div>
                    <span className="font-bold text-gray-700">{t.author}</span>, {t.role}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-5 w-5 ${starIndex < (t.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};