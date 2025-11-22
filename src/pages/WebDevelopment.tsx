import React from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Code2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { ProjectManager } from '@/components/ProjectManager';

const WebDevelopment: React.FC = () => {
  const { isAdmin } = useAdmin();

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Code2 className="h-8 w-8 text-tech-accent" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">
                Dezvoltare Web
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Site-uri web moderne, aplicații React și soluții full-stack
            </p>
          </div>
        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          <ProjectManager 
            category="web-development" 
            categoryTitle="Dezvoltare Web" 
          />
        </div>
      </section>
    </PageLayout>
  );
};

export default WebDevelopment;