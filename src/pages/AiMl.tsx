import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Plus, Search, Filter, Brain, Code, BarChart3, Zap } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AiMlProject {
  id: number;
  title: string;
  description: string;
  technology: string[];
  type: 'ml-model' | 'ai-application' | 'data-analysis' | 'automation';
  status: 'completed' | 'in-progress' | 'experimental';
  accuracy?: string;
  dataset?: string;
  framework: string;
  isPrivate?: boolean;
}

const mockProjects: AiMlProject[] = [
  {
    id: 1,
    title: 'Image Classification System',
    description: 'Model CNN pentru clasificarea automată a imaginilor în multiple categorii',
    technology: ['Python', 'TensorFlow', 'OpenCV'],
    type: 'ml-model',
    status: 'completed',
    accuracy: '94.2%',
    dataset: '50,000 images',
    framework: 'TensorFlow'
  },
  {
    id: 2,
    title: 'Chatbot Intelligence',
    description: 'Bot conversațional inteligent cu procesare naturală a limbajului',
    technology: ['Python', 'NLTK', 'Transformers'],
    type: 'ai-application',
    status: 'in-progress',
    framework: 'Hugging Face',
    isPrivate: true
  },
  {
    id: 3,
    title: 'Sales Prediction Model',
    description: 'Model predictiv pentru estimarea vânzărilor bazat pe date istorice',
    technology: ['Python', 'Scikit-learn', 'Pandas'],
    type: 'data-analysis',
    status: 'completed',
    accuracy: '87.5%',
    dataset: '2 years historical data',
    framework: 'Scikit-learn'
  },
  {
    id: 4,
    title: 'Process Automation AI',
    description: 'Sistem AI pentru automatizarea proceselor repetitive din workflow',
    technology: ['Python', 'RPA', 'Computer Vision'],
    type: 'automation',
    status: 'experimental',
    framework: 'Custom Framework'
  }
];

const AiMl: React.FC = () => {
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
      case 'experimental': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ml-model': return <Brain className="h-4 w-4" />;
      case 'ai-application': return <Bot className="h-4 w-4" />;
      case 'data-analysis': return <BarChart3 className="h-4 w-4" />;
      case 'automation': return <Zap className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ml-model': return 'ML Model';
      case 'ai-application': return 'AI App';
      case 'data-analysis': return 'Data Analysis';
      case 'automation': return 'Automation';
      default: return type;
    }
  };

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="h-8 w-8 text-tech-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                AI & Machine Learning
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modele de inteligență artificială și soluții de machine learning
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
                placeholder="Caută proiecte AI/ML..."
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
                <SelectItem value="ml-model">ML Model</SelectItem>
                <SelectItem value="ai-application">AI Application</SelectItem>
                <SelectItem value="data-analysis">Data Analysis</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
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
                <SelectItem value="experimental">Experimental</SelectItem>
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

                  {/* Type & Status */}
                  <div className="flex gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400" variant="outline">
                      {getTypeLabel(project.type)}
                    </Badge>
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status === 'completed' ? 'Finalizat' : 
                       project.status === 'in-progress' ? 'În progres' : 'Experimental'}
                    </Badge>
                  </div>

                  {/* Framework */}
                  <div className="text-center pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Framework</p>
                    <p className="font-semibold text-sm">{project.framework}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {project.accuracy && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Acuratețe</p>
                        <p className="font-semibold text-sm text-green-400">{project.accuracy}</p>
                      </div>
                    )}
                    {project.dataset && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Dataset</p>
                        <p className="font-semibold text-sm">{project.dataset}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleProjects.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite proiecte AI/ML</p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default AiMl;