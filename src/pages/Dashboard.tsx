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

// Alternate tech and art categories for better visual balance
const portfolioCategories = [
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
    id: 'digital-art',
    title: 'Artă Digitală',
    description: 'Postere, edituri, ilustrații și designuri creative realizate în Photoshop și Illustrator',
    icon: Palette,
    category: 'art' as const,
    projectCount: 15,
    route: '/digital-art'
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
    id: 'photography',
    title: 'Fotografie',
    description: 'Fotografie artistică, editare foto și capturi creative din diverse domenii',
    icon: Camera,
    category: 'art' as const,
    projectCount: 30,
    route: '/photography'
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
    category: 'art' as const,
    projectCount: 8,
    route: '/ui-ux'
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
      <section className="relative pt-24 pb-12 px-6 overflow-hidden">
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
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold gradient-text">
              Creative Portfolio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explorează universul meu creativ unde tehnologia întâlnește arta. 
              Fiecare proiect este o poveste de inovație și creativitate.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gaming-accent" />
                <span>Creative Portfolio</span>
              </div>
              <div className="h-4 border-l border-border"></div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-achievement-gold" />
                <span>Passion & Innovation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <div className="fixed bottom-8 right-8 floating">
        <button
          onClick={() => setShowAdminLogin(true)}
          className="w-12 h-12 bg-gaming-accent/80 hover:bg-gaming-accent rounded-full pulse-glow flex items-center justify-center transition-all duration-300 hover:scale-110"
          title="Admin Access"
        >
          <Settings className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Marius Bica - Creative Portfolio. Toate drepturile rezervate.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Construit cu ❤️ în React & TypeScript
          </p>
        </div>
      </footer>

      <AdminLogin open={showAdminLogin} onOpenChange={setShowAdminLogin} />
    </div>
  );
};

export default Dashboard;