import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, 
  Code2, 
  Database, 
  Smartphone, 
  Pencil, 
  Bot, 
  PenTool, 
  Camera,
  Star,
  Heart,
  Settings
} from 'lucide-react';
import { PortfolioCard } from '@/components/PortfolioCard';
import { Navigation } from '@/components/Navigation';
import { AdminLogin } from '@/components/AdminLogin';
import { useAdmin } from '@/contexts/AdminContext';
import { useData } from '@/contexts/DataContext';
import { PORTFOLIO_CATEGORIES, CONTACT_INFO } from '@/constants';
import heroWorkspace from '@/assets/hero-workspace.jpg';

// Tech categories first, then art categories
const portfolioCategories = PORTFOLIO_CATEGORIES.map(category => ({
  ...category,
  icon: category.id === 'web-development' ? Code2 :
        category.id === 'database-projects' ? Database :
        category.id === 'ai-ml-projects' ? Bot :
        category.id === 'ui-ux-design' ? Smartphone :
        category.id === 'digital-art' ? Palette :
        category.id === 'photography' ? Camera :
        category.id === 'traditional-art' ? Pencil :
        PenTool
}));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAdmin();
  const { getProjectCountByCategory, getTotalProjectCountByCategory } = useData();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      {/* Hero Section - Compact */}
      <section className="relative pt-12 sm:pt-14 md:pt-16 pb-4 sm:pb-6 md:pb-8 responsive-padding overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${heroWorkspace})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        
        <div className="relative z-10 responsive-container text-center">
          <div className="space-y-2 sm:space-y-3 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
              Bica Marius Adrian Digital Portfolio
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Step into my digital universe, where technology and art forge a seamless synergy.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gaming-accent" />
              <span>Digital Portfolio</span>
              <div className="hidden sm:block h-4 border-l border-border mx-2"></div>
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-achievement-gold" />
              <span>Passion & Innovation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid - Compact */}
      <section className="py-4 sm:py-6 md:py-8 responsive-padding flex-1">
        <div className="responsive-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {portfolioCategories.map((category, index) => {
              const projectCount = isAdmin 
                ? getTotalProjectCountByCategory(category.id)
                : getProjectCountByCategory(category.id);
              
              return (
                <div 
                  key={category.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PortfolioCard
                    title={category.title}
                    description={category.description}
                    icon={category.icon}
                    category={category.category}
                    projectCount={projectCount}
                    onClick={() => navigate(category.route)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Admin Floating Button */}
      <div className="responsive-admin-button z-50">
        {isAdmin ? (
          <button
            onClick={() => {
              const confirmed = confirm('Vrei să ieși din modul admin?');
              if (confirmed) {
                logout();
              }
            }}
            className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110"
            title="Logout Admin"
          >
            <div className="absolute inset-0 rounded-full bg-red-500/20"></div>
            <div className="relative w-full h-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8" />
              </svg>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowAdminLogin(true)}
            className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 animate-pulse-glow"
            title="Admin Access"
          >
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-ping opacity-20"></div>
            
            {/* Inner glow */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        )}
      </div>

      {/* Footer - Compact */}
      <footer className="relative bg-gradient-to-br from-background via-background/95 to-card/50 border-t border-border/50 py-6 md:py-8 px-4 md:px-6 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        </div>
        
        <div className="responsive-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            {/* Brand Section */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MB</span>
                </div>
                <h3 className="text-base font-bold gradient-text">{CONTACT_INFO.name}</h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                {CONTACT_INFO.title}
              </p>
              <p className="text-xs text-muted-foreground/80">
                © 2024 {CONTACT_INFO.name}. Toate drepturile rezervate.
              </p>
            </div>

            {/* Social Media */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-sm mb-2 text-foreground">Social Media</h4>
              <div className="flex justify-center md:justify-start gap-3">
                <a
                  href={CONTACT_INFO.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4 text-pink-500 group-hover:text-pink-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={CONTACT_INFO.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <svg className="h-4 w-4 text-blue-600 group-hover:text-blue-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href={CONTACT_INFO.socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-full bg-gradient-to-br from-blue-700/10 to-blue-800/10 hover:from-blue-700/20 hover:to-blue-800/20 transition-all duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <svg className="h-4 w-4 text-blue-700 group-hover:text-blue-600 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href={CONTACT_INFO.socialMedia.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-full bg-gradient-to-br from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20 transition-all duration-300 hover:scale-110"
                  aria-label="GitHub"
                >
                  <svg className="h-4 w-4 text-gray-600 group-hover:text-gray-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AdminLogin open={showAdminLogin} onOpenChange={setShowAdminLogin} />
    </div>
  );
};

export default Dashboard;