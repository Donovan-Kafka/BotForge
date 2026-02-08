import React, { useState, useEffect } from 'react';
import { Testimonial, User } from '../types';
import { PricingPage } from './PricingPage';
import { FAQPage } from './FAQPage';
import { Search, RotateCw, Settings, Star } from 'lucide-react';
import { featureService, publicService } from '../api';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  user?: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const [features, setFeatures] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<{
    url: string;
    title: string;
    description: string;
  } | null>(null);

  const [landingImages, setLandingImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchFeatures = async () => {
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
            role: t.role,
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

    const fetchLandingImages = async () => {
      try {
        const res = await publicService.getLandingImages();
        if (res && Array.isArray(res)) {
          setLandingImages(res);
        }
      } catch (error) {
        console.error("Failed to fetch landing images", error);
      }
    };

    fetchFeatures();
    fetchTestimonials();
    fetchFeaturedVideo();
    fetchLandingImages();
  }, []);

  useEffect(() => {
    if (landingImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        (prev + 1) % landingImages.length
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [landingImages]);

  return (
    <div className="w-full bg-slate-50 selection:bg-blue-100 selection:text-blue-700 font-sans">

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-blue-600 pt-10 pb-20 lg:pt-20 lg:pb-28">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 z-0"></div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-50 text-sm font-medium border border-blue-400/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                AI-Powered Automation
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                Build intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-100">AI Agents</span> in minutes
              </h1>
              <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Deploy custom chatbots that understand your business. No coding required—just pure performance and automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-blue-900 bg-white hover:bg-blue-50 rounded-full shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
                >
                  Register as an Organisation
                </Link>
                <div
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm"
                  onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}
                >
                  View Features
                </div>
              </div>
            </div>

            {/* Hero Image Carousel */}
            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/40 border-4 border-white/10 bg-slate-900 aspect-[4/3]">
                <img
                  src={landingImages[currentImageIndex]?.image_url || "/landing-images/default.png"}
                  alt={landingImages[currentImageIndex]?.alt_text || "BotForge Dashboard"}
                  className="w-full h-full object-cover transition-opacity duration-700 opacity-90 hover:opacity-100"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-2xl -z-10 backdrop-blur-md rotate-6 border border-white/10"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-400/20 rounded-full -z-10 blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Patron Access Section */}
      <div className="bg-slate-900 py-4 lg:py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 backdrop-blur-sm">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">
                Just here to chat with a bot?
              </h2>
              <p className="text-slate-400">
                Register as a patron to explore and interact with available chatbots.
              </p>
            </div>
            <Link
              to="/patron/register"
              className="whitespace-nowrap bg-blue-600 text-white hover:bg-blue-500 font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-blue-500/20"
            >
              Register as a Patron
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-blue-50 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Powerful Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-6">Our Features</h2>
            <p className="text-slate-500 text-lg">Forge the ultimate bot for your own needs.</p>
          </div>

          {/* Featured Video */}
          <div className="max-w-5xl mx-auto mb-24">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white bg-slate-100 aspect-video">
              {featuredVideo?.url ? (
                <iframe
                  className="w-full h-full"
                  src={featuredVideo.url}
                  title={featuredVideo.title || "Featured video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No featured video set yet.
                </div>
              )}
            </div>

            {(featuredVideo?.title || featuredVideo?.description) && (
              <div className="text-center mt-8">
                {featuredVideo?.title && (
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{featuredVideo.title}</h3>
                )}
                {featuredVideo?.description && (
                  <p className="text-slate-500 max-w-2xl mx-auto">{featuredVideo.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              let Icon = Search;
              if (feature.name.includes("Train")) Icon = RotateCw;
              if (feature.name.includes("Customize")) Icon = Settings;

              return (
                <div key={feature.id} className={`group p-8 rounded-3xl border border-blue-100 bg-white hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300`}>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-100/50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="bg-white py-24 sm:py-32 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">Trusted by Industry Leaders</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 relative group hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                <div className="text-6xl text-blue-200 font-serif absolute top-6 left-6 -z-10 group-hover:text-blue-100 transition-colors">"</div>

                <p className="text-slate-700 mb-8 relative z-10 pt-2 text-lg font-medium leading-relaxed">
                  {t.quote}
                </p>

                <div className="flex justify-between items-center border-t border-blue-100 pt-6">
                  <div>
                    <span className="font-bold text-slate-900 block">{t.author}</span>
                    <span className="text-slate-500 text-sm">{t.role}</span>
                  </div>
                  <div className="flex gap-1 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-4 w-4 ${starIndex < (t.rating || 5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-slate-200'
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

      {/* Pricing Section */}
      <div id="pricing" className="bg-slate-50 border-t border-slate-200">
        <PricingPage user={user || null} />
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-white border-t border-slate-200 selection:bg-indigo-100 selection:text-indigo-700">
        <FAQPage />
      </div>

    </div>
  );
};