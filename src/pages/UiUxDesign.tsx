import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Plus, Search, Filter, Monitor, Tablet, Eye, ExternalLink } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface UiUxProject {
  id: number;
  title: string;
  description: string;
  type: 'mobile-app' | 'web-app' | 'dashboard' | 'landing-page' | 'prototype';
  tools: string[];
  platform: 'ios' | 'android' | 'web' | 'desktop' | 'cross-platform';
  status: 'concept' | 'prototype' | 'final' | 'implemented';
  image: string;
  screens?: number;
  interactive?: boolean;
  isPrivate?: boolean;
}

const mockProjects: UiUxProject[] = [
  {
    id: 1,
    title: 'Banking Mobile App',
    description: 'Interfață modernă pentru aplicația de banking cu focus pe UX',
    type: 'mobile-app',
    tools: ['Figma', 'Principle', 'Adobe XD'],
    platform: 'ios',
    status: 'implemented',
    image: '/placeholder.svg',
    screens: 25,
    interactive: true
  },
  {
    id: 2,
    title: 'E-commerce Dashboard',
    description: 'Dashboard analytics pentru magazin online cu vizualizări complexe',
    type: 'dashboard',
    tools: ['Sketch', 'InVision', 'Framer'],
    platform: 'web',
    status: 'prototype',
    image: '/placeholder.svg',
    screens: 12,
    interactive: true,
    isPrivate: true
  },
  {
    id: 3,
    title: 'Food Delivery App',
    description: 'Design complet pentru aplicația de livrare mâncare',
    type: 'mobile-app',
    tools: ['Figma', 'ProtoPie'],
    platform: 'cross-platform',
    status: 'final',
    image: '/placeholder.svg',
    screens: 30,
    interactive: false
  }
];

const UiUxDesign: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const visibleProjects = (isAdmin ? mockProjects : mockProjects.filter(project => !project.isPrivate))
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || project.type === filterType) &&
      (filterPlatform === 'all' || project.platform === filterPlatform)
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-500/20 text-green-400';
      case 'final': return 'bg-blue-500/20 text-blue-400';
      case 'prototype': return 'bg-yellow-500/20 text-yellow-400';
      case 'concept': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios':
      case 'android': return <Smartphone className="h-4 w-4" />;
      case 'web': return <Monitor className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'cross-platform': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smartphone className="h-8 w-8 text-art-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Design UI/UX
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interfețe moderne și experiențe utilizator intuitive
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută proiecte UI/UX..."
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
                <SelectItem value="mobile-app">Mobile App</SelectItem>
                <SelectItem value="web-app">Web App</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="landing-page">Landing Page</SelectItem>
                <SelectItem value="prototype">Prototype</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platformă" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="cross-platform">Cross-platform</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button className="bg-art-accent hover:bg-art-accent/80">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Design
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project, index) => (
              <Card 
                key={project.id}
                className="group cursor-pointer overflow-hidden hover-scale animate-scale-in border-art-accent/20 hover:border-art-accent/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
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
                    <div className="absolute top-4 left-4 flex gap-2">
                      {project.interactive && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                          <Eye className="h-3 w-3 mr-1" />
                          Interactiv
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                      <p className="text-muted-foreground text-sm">{project.description}</p>
                    </div>

                    {/* Tools */}
                    <div className="flex flex-wrap gap-2">
                      {project.tools.map((tool) => (
                        <span 
                          key={tool}
                          className="px-2 py-1 bg-art-accent/20 text-art-accent rounded-md text-xs"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    {/* Platform & Status */}
                    <div className="flex gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400" variant="outline">
                        <span className="flex items-center gap-1">
                          {getPlatformIcon(project.platform)}
                          {project.platform.charAt(0).toUpperCase() + project.platform.slice(1)}
                        </span>
                      </Badge>
                      <Badge className={getStatusColor(project.status)} variant="outline">
                        {project.status === 'implemented' ? 'Implementat' : 
                         project.status === 'final' ? 'Finalizat' :
                         project.status === 'prototype' ? 'Prototip' : 'Concept'}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ecrane</p>
                        <p className="font-semibold text-sm">{project.screens || 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Tip</p>
                        <p className="font-semibold text-sm capitalize">
                          {project.type.replace('-', ' ')}
                        </p>
                      </div>
                      {project.interactive && (
                        <Button size="sm" variant="outline" className="border-art-accent/20 hover:border-art-accent">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Vezi
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleProjects.length === 0 && (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite proiecte UI/UX</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UiUxDesign;