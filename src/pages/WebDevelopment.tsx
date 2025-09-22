import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Code2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { ProjectManager } from '@/components/ProjectManager';

const WebDevelopment: React.FC = () => {
  const { isAdmin } = useAdmin();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="responsive-hero responsive-padding">
        <div className="responsive-container">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Code2 className="h-8 w-8 text-tech-accent" />
              <h1 className="responsive-heading font-bold gradient-text">
                Dezvoltare Web
              </h1>
            </div>
            <p className="responsive-text text-muted-foreground max-w-2xl mx-auto">
              Site-uri web moderne, aplicații React și soluții full-stack
            </p>
          </div>

          {/* Projects Management */}
          <ProjectManager 
            category="web-development" 
            categoryTitle="Dezvoltare Web" 
          />
        </div>
      </div>
    </div>
  );
};

export default WebDevelopment;