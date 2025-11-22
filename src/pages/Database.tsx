import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database as DatabaseIcon, Plus, Search, Filter, BarChart3, Users, Server, Code } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DatabaseProject {
  id: number;
  title: string;
  description: string;
  technology: string[];
  type: 'design' | 'optimization' | 'migration' | 'analysis';
  status: 'completed' | 'in-progress' | 'archived';
  complexity: 'simple' | 'medium' | 'complex';
  tableCount?: number;
  recordCount?: string;
  performanceGain?: string;
  isPrivate?: boolean;
}

const mockProjects: DatabaseProject[] = [
  {
    id: 1,
    title: 'E-commerce Database Design',
    description: 'Design complet pentru baza de date e-commerce cu optimizări pentru performanță',
    technology: ['PostgreSQL', 'Redis', 'MongoDB'],
    type: 'design',
    status: 'completed',
    complexity: 'complex',
    tableCount: 45,
    recordCount: '2.5M+',
    performanceGain: '40% faster queries'
  },
  {
    id: 2,
    title: 'Legacy System Migration',
    description: 'Migrarea unui sistem vechi Oracle către PostgreSQL cu zero downtime',
    technology: ['Oracle', 'PostgreSQL', 'Docker'],
    type: 'migration',
    status: 'completed',
    complexity: 'complex',
    tableCount: 120,
    recordCount: '50M+',
    isPrivate: true
  },
  {
    id: 3,
    title: 'Query Performance Analysis',
    description: 'Analiză și optimizare queries pentru reducerea timpilor de răspuns',
    technology: ['MySQL', 'ElasticSearch'],
    type: 'optimization',
    status: 'in-progress',
    complexity: 'medium',
    performanceGain: '60% improvement'
  }
];

const Database: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const visibleProjects = (isAdmin ? mockProjects : mockProjects.filter(project => !project.isPrivate))
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || project.type === filterType) &&
      (filterStatus === 'all' || project.status === filterStatus)
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-blue-500/20 text-blue-400';
      case 'medium': return 'bg-orange-500/20 text-orange-400';
      case 'complex': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'design': return <DatabaseIcon className="h-4 w-4" />;
      case 'optimization': return <BarChart3 className="h-4 w-4" />;
      case 'migration': return <Server className="h-4 w-4" />;
      case 'analysis': return <Users className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <DatabaseIcon className="h-8 w-8 text-tech-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Proiecte Baze de Date
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Design, optimizare și management sisteme de baze de date complexe
            </p>
          </div>

        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
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
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tip proiect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="optimization">Optimizare</SelectItem>
                <SelectItem value="migration">Migrare</SelectItem>
                <SelectItem value="analysis">Analiză</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="completed">Finalizat</SelectItem>
                <SelectItem value="in-progress">În progres</SelectItem>
                <SelectItem value="archived">Arhivat</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button className="bg-tech-accent hover:bg-tech-accent/80">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Proiect
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project, index) => (
              <Card 
                key={project.id}
                className="hover-scale cursor-pointer group border-tech-accent/20 hover:border-tech-accent/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(project.type)}
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                    </div>
                    {project.isPrivate && !isAdmin && (
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    {project.description}
                  </p>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2">
                    {project.technology.map((tech) => (
                      <span 
                        key={tech}
                        className="px-2 py-1 bg-tech-accent/20 text-tech-accent rounded-md text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Status & Complexity */}
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status === 'completed' ? 'Finalizat' : 
                       project.status === 'in-progress' ? 'În progres' : 'Arhivat'}
                    </Badge>
                    <Badge className={getComplexityColor(project.complexity)} variant="outline">
                      {project.complexity === 'simple' ? 'Simplu' :
                       project.complexity === 'medium' ? 'Mediu' : 'Complex'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    {project.tableCount && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Tabele</p>
                        <p className="font-semibold text-sm">{project.tableCount}</p>
                      </div>
                    )}
                    {project.recordCount && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Înregistrări</p>
                        <p className="font-semibold text-sm">{project.recordCount}</p>
                      </div>
                    )}
                    {project.performanceGain && (
                      <div className="text-center col-span-2">
                        <p className="text-xs text-muted-foreground">Îmbunătățire</p>
                        <p className="font-semibold text-sm text-green-400">{project.performanceGain}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleProjects.length === 0 && (
            <div className="text-center py-12">
              <DatabaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite proiecte</p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Database;