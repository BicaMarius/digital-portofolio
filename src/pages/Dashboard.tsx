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
import heroWorkspace from '@/assets/hero-workspace.jpg';

// Tech categories first, then art categories
const portfolioCategories = [
  // Tech Categories
  {
    id: 'web-development',
    title: 'Dezvoltare Web',
    description: 'Site-uri web, aplicații React și proiecte full-stack cu tehnologii moderne',
    icon: Code2,
    category: 'tech' as const,
    projectCount: 12,
    route: '/web-dev'
  },
  {
    id: 'database-projects',
    title: 'Proiecte Baze de Date',
    description: 'Sisteme de management al datelor, optimizări și arhitecturi complexe',
    icon: Database,
    category: 'tech' as const,
    projectCount: 6,
    route: '/database'
  },
  {
    id: 'ai-ml-projects',
    title: 'AI & Machine Learning',
    description: 'Proiecte cu inteligență artificială, modele ML și experimente cu tehnologii AI',
    icon: Bot,
    category: 'tech' as const,
    projectCount: 4,
    route: '/ai-ml'
  },
  {
    id: 'ui-ux-design',
    title: 'Design UI/UX',
    description: 'Interfețe de aplicații, prototipuri și experiențe utilizator inovatoare',
    icon: Smartphone,
    category: 'tech' as const,
    projectCount: 8,
    route: '/ui-ux'
  },
  // Art Categories
  {
    id: 'digital-art',
    title: 'Artă Digitală',
    description: 'Postere, edituri, ilustrații și designuri creative realizate în Photoshop și Illustrator',
    icon: Palette,
    category: 'art' as const,
    projectCount: 15,
    route: '/digital-art'
  },
  {
    id: 'photography',
    title: 'Fotografie',
    description: 'Fotografie artistică, editare foto și capturi creative din diverse domenii',
    icon: Camera,
    category: 'art' as const,
    projectCount: 30,
    route: '/photography'
  },
  {
    id: 'traditional-art',
    title: 'Artă Tradițională',
    description: 'Desene pe foaie, picturi și creații artistice realizate cu instrumente tradiționale',
    icon: Pencil,
    category: 'art' as const,
    projectCount: 20,
    route: '/traditional-art'
  },
  {
    id: 'creative-writing',
    title: 'Scriere Creativă',
    description: 'Poezii, texte creative și alte forme de expresie literară',
    icon: PenTool,
    category: 'art' as const,
    projectCount: 25,
    route: '/writing'
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 overflow-hidden">
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
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="space-y-4 md:space-y-6 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">
              Bica Marius Adrian Digital Portfolio
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Explorează universul meu creativ unde tehnologia întâlnește arta. 
              Fiecare proiect este o poveste de inovație și creativitate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gaming-accent" />
                <span>Digital Portfolio</span>
              </div>
              <div className="hidden sm:block h-4 border-l border-border"></div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-achievement-gold" />
                <span>Passion & Innovation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {portfolioCategories.map((category, index) => (
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
                  projectCount={category.projectCount}
                  onClick={() => navigate(category.route)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Floating Button */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 floating z-50">
        <button
          onClick={() => setShowAdminLogin(true)}
          className="w-4 h-4 bg-gradient-to-r from-gaming-accent to-achievement-gold rounded-full pulse-glow animate-bounce shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-125"
          title="Admin Access"
        >
          <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm"></div>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border/50 py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-center md:text-left text-sm md:text-base">
              © 2024 Bica Marius Adrian - Digital Portfolio. Toate drepturile rezervate.
            </p>
            <div className="flex items-center gap-3 md:gap-4">
              <a
                href="https://instagram.com/bicamarius"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-gaming-accent transition-colors duration-300 p-2 hover:bg-gaming-accent/10 rounded-lg"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com/bicamarius"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-gaming-accent transition-colors duration-300 p-2 hover:bg-gaming-accent/10 rounded-lg"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/bicamarius"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-gaming-accent transition-colors duration-300 p-2 hover:bg-gaming-accent/10 rounded-lg"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AdminLogin open={showAdminLogin} onOpenChange={setShowAdminLogin} />
    </div>
  );
};

export default Dashboard;