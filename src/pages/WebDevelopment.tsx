import React from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Code2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { ProjectManager } from '@/components/ProjectManager';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';

const WebDevelopment: React.FC = () => {
  const { isAdmin } = useAdmin();
  const { getCount, isLoading } = usePortfolioStats();
  const projectCount = getCount('web-development');

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Code2 className="h-8 w-8 text-tech-accent" />
              <h1 className="text-2xl font-bold gradient-text">
                Dezvoltare Web
              </h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Site-uri web moderne, aplicații React și soluții full-stack
            </p>
          </div>
        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Proiecte</h2>
            <span className="text-sm text-muted-foreground">
              Total: {isLoading ? '…' : projectCount}
            </span>
          </div>
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