import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DigitalArtProject {
  id: number;
  title: string;
  software: string;
  category: 'poster' | 'illustration' | 'logo' | 'banner' | 'social-media';
  image: string;
  date: string;
  dimensions?: string;
  description?: string;
  isPrivate?: boolean;
}

const mockProjects: DigitalArtProject[] = [
  {
    id: 1,
    title: 'Music Festival Poster',
    software: 'Adobe Photoshop',
    category: 'poster',
    image: '/placeholder.svg',
    date: '2024-01-20',
    dimensions: '2480x3508px',
    description: 'Poster vibrant pentru festival de muzică electronică'
  },
  {
    id: 2,
    title: 'Brand Logo Design',
    software: 'Adobe Illustrator',
    category: 'logo',
    image: '/placeholder.svg',
    date: '2024-02-15',
    dimensions: 'Vector',
    description: 'Logo modern pentru start-up tehnologic',
    isPrivate: true
  },
  {
    id: 3,
    title: 'Digital Illustration',
    software: 'Procreate',
    category: 'illustration',
    image: '/placeholder.svg',
    date: '2024-03-10',
    dimensions: '4000x4000px',
    description: 'Ilustrație digitală în stil cyberpunk'
  }
];

const DigitalArt: React.FC = () => {
  const { isAdmin } = useAdmin();
  const { getCount, isLoading } = usePortfolioStats();
  const [selectedProject, setSelectedProject] = useState<DigitalArtProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const projectsPerPage = viewMode === 'grid' ? 12 : 6;

  const visibleProjects = (isAdmin ? mockProjects : mockProjects.filter(project => !project.isPrivate))
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'all' || project.category === filterCategory)
    );

  const totalPages = Math.ceil(visibleProjects.length / projectsPerPage);
  const currentProjects = visibleProjects.slice(
    currentPage * projectsPerPage,
    (currentPage + 1) * projectsPerPage
  );

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Palette className="h-8 w-8 text-art-accent" />
              <h1 className="text-2xl font-bold gradient-text">
                Artă Digitală
              </h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Postere, ilustrații și designuri creative realizate digital
            </p>
          </div>

        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Lucrări Digitale</h2>
            <span className="text-sm text-muted-foreground">
              Total: {isLoading ? '…' : (getCount('digital-art') || visibleProjects.length)}
            </span>
          </div>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută proiecte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="poster">Postere</SelectItem>
                <SelectItem value="illustration">Ilustrații</SelectItem>
                <SelectItem value="logo">Logo-uri</SelectItem>
                <SelectItem value="banner">Bannere</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {isAdmin && (
              <Button className="bg-art-accent hover:bg-art-accent/80">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" 
            : "space-y-4 mb-8"
          }>
            {currentProjects.map((project, index) => (
              <Card 
                key={project.id}
                className="group cursor-pointer overflow-hidden hover-scale animate-scale-in border-art-accent/20 hover:border-art-accent/50"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-0">
                  <div className={viewMode === 'grid' ? "aspect-[3/4]" : "aspect-video md:aspect-[3/2]"}>
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {project.isPrivate && !isAdmin && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">Private</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{project.software}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-art-accent/20 text-art-accent rounded-md capitalize">
                        {project.category}
                      </span>
                      <span>{project.date}</span>
                    </div>
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
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-muted-foreground">
                {currentPage + 1} din {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Full Screen Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-card">
          {selectedProject && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setSelectedProject(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="aspect-[3/4] bg-muted">
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedProject.title}</h3>
                    <p className="text-muted-foreground">{selectedProject.description}</p>
                  </div>
                  <Button size="sm" className="bg-art-accent hover:bg-art-accent/80">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Software:</span>
                    <p className="font-medium">{selectedProject.software}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <p className="font-medium capitalize">{selectedProject.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium">{selectedProject.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dimensiuni:</span>
                    <p className="font-medium">{selectedProject.dimensions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default DigitalArt;