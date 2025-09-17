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
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo/Back Button */}
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi
            </Button>
          )}
          
          <h1 className="text-xl font-bold gradient-text cursor-pointer" onClick={() => navigate('/')}>
            Creative Portfolio
          </h1>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={isHomePage ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Button
            variant={location.pathname === '/profile' ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate('/profile')}
            className="hover:bg-secondary/10"
          >
            <User className="h-4 w-4 mr-2" />
            Profil
          </Button>
        </div>
      </div>
    </nav>
  );
};