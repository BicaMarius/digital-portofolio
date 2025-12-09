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
      {/* Desktop layout */}
      <div className="hidden sm:flex responsive-container responsive-nav items-center gap-4">
        {/* Logo - fixed width for balance */}
        <div className="flex items-center gap-4 w-48">
          <h1
            className="text-xl font-bold gradient-text cursor-pointer"
            onClick={() => navigate('/')}
          >
            Creative Portfolio
          </h1>
        </div>

        {/* Quick selectors - centered */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 shadow-sm">
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

        {/* Navigation Buttons - fixed width for balance */}
        <div className="flex items-center gap-2 w-48 justify-end">
          <Button
            variant={isHomePage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>

          <Button
            variant={location.pathname === '/profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/profile')}
            className="hover:bg-secondary/10"
          >
            <User className="h-4 w-4 mr-2" />
            Profil
          </Button>
        </div>
      </div>

      {/* Mobile layout: single row with logo, centered icons, right icons */}
      <div className="flex sm:hidden items-center px-3 py-2">
        {/* Logo - fixed width for balance */}
        <div className="w-12">
          <h1
            className="text-lg font-bold gradient-text cursor-pointer"
            onClick={() => navigate('/')}
          >
            CP
          </h1>
        </div>

        {/* Centered quick selectors (icons only) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
          <Button
            variant={location.pathname === '/films' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/films')}
          >
            <Clapperboard className="h-4 w-4" />
          </Button>
          <Button
            variant={location.pathname === '/music' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/music')}
          >
            <Music className="h-4 w-4" />
          </Button>
          <Button
            variant={location.pathname === '/notes' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/notes')}
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          </div>
        </div>

        {/* Right nav icons - fixed width for balance */}
        <div className="flex items-center gap-1 w-12 justify-end">
          <Button
            variant={isHomePage ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant={location.pathname === '/profile' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};