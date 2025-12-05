import React from 'react';
import { User, Home, Clapperboard, Music, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="responsive-container responsive-nav flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <h1
            className="text-lg sm:text-xl font-bold gradient-text cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="hidden sm:inline">Creative Portfolio</span>
            <span className="sm:hidden">CP</span>
          </h1>
        </div>

        {/* Quick selectors */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 shadow-sm overflow-x-auto whitespace-nowrap max-w-full sm:max-w-2xl scrollbar-thin">
            <Button
              variant={location.pathname === '/films' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate('/films')}
            >
              <Clapperboard className="h-4 w-4" />
              <span className="hidden md:inline">Filme</span>
            </Button>
            <Button
              variant={location.pathname === '/music' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate('/music')}
            >
              <Music className="h-4 w-4" />
              <span className="hidden md:inline">Muzică</span>
            </Button>
            <Button
              variant={location.pathname === '/notes' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate('/notes')}
            >
              <StickyNote className="h-4 w-4" />
              <span className="hidden md:inline">Notițe</span>
            </Button>
          </div>
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