import React from 'react';
import { User, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="responsive-container responsive-nav flex items-center justify-between">
        {/* Logo/Back Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10 hover:text-primary hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Înapoi</span>
            </Button>
          )}
          
          <h1 
            className="text-lg sm:text-xl font-bold gradient-text cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <span className="hidden sm:inline">Creative Portfolio</span>
            <span className="sm:hidden">CP</span>
          </h1>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={isHomePage ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          
          <Button
            variant={location.pathname === '/profile' ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate('/profile')}
            className="hover:bg-secondary/10"
          >
            <User className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Profil</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};