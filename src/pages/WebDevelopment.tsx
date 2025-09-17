import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ExternalLink, Code2, Globe, Plus } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface WebProject {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  link?: string;
  isPrivate?: boolean;
}

const mockProjects: WebProject[] = [
  {
    id: 1,
    title: 'E-commerce Platform',
    description: 'Platformă completă de comerț online cu React și Node.js',
    image: '/placeholder.svg',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    link: 'https://example.com'
  },
  {
    id: 2,
    title: 'Portfolio Website',
    description: 'Site personal cu design modern și animații interactive',
    image: '/placeholder.svg',
    technologies: ['React', 'TypeScript', 'Tailwind CSS'],
    link: 'https://portfolio.example.com'
  },
  {
    id: 3,
    title: 'Task Management App',
    description: 'Aplicație de management al sarcinilor cu colaborare în timp real',
    image: '/placeholder.svg',
    technologies: ['React', 'Firebase', 'Material-UI'],
    isPrivate: true
  }
];

const WebDevelopment: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProject, setSelectedProject] = useState<WebProject | null>(null);
  const projectsPerPage = 4;
  
  const visibleProjects = isAdmin 
    ? mockProjects 
    : mockProjects.filter(project => !project.isPrivate);
  
  const totalPages = Math.ceil(visibleProjects.length / projectsPerPage);
  const currentProjects = visibleProjects.slice(
    currentPage * projectsPerPage,
    (currentPage + 1) * projectsPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Code2 className="h-8 w-8 text-tech-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Dezvoltare Web
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Site-uri web moderne, aplicații React și soluții full-stack
            </p>
            {isAdmin && (
              <Button className="mt-4 bg-tech-accent hover:bg-tech-accent/80">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Proiect
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {currentProjects.map((project, index) => (
              <Card 
                key={project.id}
                className="hover-scale cursor-pointer group border-tech-accent/20 hover:border-tech-accent/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {project.isPrivate && !isAdmin && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">Private Project</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech) => (
                        <span 
                          key={tech}
                          className="px-2 py-1 bg-tech-accent/20 text-tech-accent rounded-md text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    {project.link && (
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vezi Site-ul
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="border-tech-accent/20 hover:border-tech-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(index)}
                    className={currentPage === index ? "bg-tech-accent hover:bg-tech-accent/80" : "border-tech-accent/20"}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="border-tech-accent/20 hover:border-tech-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebDevelopment;