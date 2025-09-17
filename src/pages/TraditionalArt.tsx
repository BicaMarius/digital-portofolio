import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, X, Palette, Brush } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TraditionalArtwork {
  id: number;
  title: string;
  medium: string;
  category: 'drawing' | 'painting' | 'sketch' | 'portrait' | 'landscape';
  image: string;
  date: string;
  dimensions?: string;
  description?: string;
  materials: string[];
  isPrivate?: boolean;
}

const mockArtworks: TraditionalArtwork[] = [
  {
    id: 1,
    title: 'Portret în Cărbune',
    medium: 'Cărbune pe hârtie',
    category: 'portrait',
    image: '/placeholder.svg',
    date: '2024-01-15',
    dimensions: '30x40cm',
    description: 'Portret realist realizat în tehnică cărbune',
    materials: ['Cărbune', 'Hârtie Canson', 'Estompă']
  },
  {
    id: 2,
    title: 'Peisaj de Vară',
    medium: 'Acuarelă',
    category: 'landscape',
    image: '/placeholder.svg',
    date: '2024-02-20',
    dimensions: '25x35cm',
    description: 'Peisaj pastoral în acuarelă cu tehnici de umiditate',
    materials: ['Acuarele', 'Hârtie acuarelă', 'Pensule naturale'],
    isPrivate: true
  },
  {
    id: 3,
    title: 'Studiu Anatomic',
    medium: 'Creion grafit',
    category: 'drawing',
    image: '/placeholder.svg',
    date: '2024-03-05',
    dimensions: '21x29.7cm',
    description: 'Studiu de anatomie umană cu focus pe proporții',
    materials: ['Creion 2H-6B', 'Hârtie texturată', 'Gumă mălăiață']
  },
  {
    id: 4,
    title: 'Natură Moartă',
    medium: 'Ulei pe pânză',
    category: 'painting',
    image: '/placeholder.svg',
    date: '2024-01-30',
    dimensions: '40x50cm',
    description: 'Compoziție clasică de natură moartă în tehnica ulei',
    materials: ['Culori ulei', 'Pânză întinsă', 'Pensule în păr de porc']
  }
];

const TraditionalArt: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [selectedArtwork, setSelectedArtwork] = useState<TraditionalArtwork | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const artworksPerPage = viewMode === 'grid' ? 12 : 6;

  const visibleArtworks = (isAdmin ? mockArtworks : mockArtworks.filter(artwork => !artwork.isPrivate))
    .filter(artwork => 
      artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'all' || artwork.category === filterCategory)
    );

  const totalPages = Math.ceil(visibleArtworks.length / artworksPerPage);
  const currentArtworks = visibleArtworks.slice(
    currentPage * artworksPerPage,
    (currentPage + 1) * artworksPerPage
  );

  const nextArtwork = () => {
    if (selectedArtwork) {
      const currentIndex = visibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const nextIndex = (currentIndex + 1) % visibleArtworks.length;
      setSelectedArtwork(visibleArtworks[nextIndex]);
    }
  };

  const prevArtwork = () => {
    if (selectedArtwork) {
      const currentIndex = visibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const prevIndex = (currentIndex - 1 + visibleArtworks.length) % visibleArtworks.length;
      setSelectedArtwork(visibleArtworks[prevIndex]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drawing': return <Pencil className="h-3 w-3" />;
      case 'painting': return <Brush className="h-3 w-3" />;
      default: return <Palette className="h-3 w-3" />;
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
              <Pencil className="h-8 w-8 text-art-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Artă Tradițională
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Desene, picturi și creații artistice realizate cu instrumente tradiționale
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută opere de artă..."
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
                <SelectItem value="drawing">Desenuri</SelectItem>
                <SelectItem value="painting">Picturi</SelectItem>
                <SelectItem value="sketch">Schițe</SelectItem>
                <SelectItem value="portrait">Portrete</SelectItem>
                <SelectItem value="landscape">Peisaje</SelectItem>
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
                Adaugă Operă
              </Button>
            )}
          </div>

          {/* Artworks Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8" 
            : "space-y-6 mb-8"
          }>
            {currentArtworks.map((artwork, index) => (
              <Card 
                key={artwork.id}
                className="group cursor-pointer overflow-hidden hover-scale animate-scale-in border-art-accent/20 hover:border-art-accent/50"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedArtwork(artwork)}
              >
                <CardContent className="p-0">
                  <div className={viewMode === 'list' 
                    ? "flex gap-4" 
                    : "flex flex-col"
                  }>
                    <div className={viewMode === 'grid' 
                      ? "aspect-[3/4] overflow-hidden" 
                      : "w-48 h-36 flex-shrink-0 overflow-hidden rounded-lg"
                    }>
                      <img 
                        src={artwork.image} 
                        alt={artwork.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {artwork.isPrivate && !isAdmin && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Private</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={viewMode === 'grid' ? "p-4" : "flex-1 p-4"}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{artwork.title}</h3>
                        <Badge className="bg-art-accent/20 text-art-accent ml-2" variant="outline">
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(artwork.category)}
                            {artwork.category}
                          </span>
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-2">{artwork.medium}</p>
                      
                      {viewMode === 'list' && artwork.description && (
                        <p className="text-muted-foreground text-sm mb-3">{artwork.description}</p>
                      )}
                      
                      <div className={viewMode === 'grid' 
                        ? "flex justify-between items-center text-xs text-muted-foreground" 
                        : "flex gap-4 text-xs text-muted-foreground"
                      }>
                        <span>{artwork.date}</span>
                        {artwork.dimensions && <span>{artwork.dimensions}</span>}
                      </div>
                      
                      {viewMode === 'list' && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {artwork.materials.slice(0, 3).map((material) => (
                            <span 
                              key={material}
                              className="px-2 py-1 bg-muted rounded text-xs"
                            >
                              {material}
                            </span>
                          ))}
                          {artwork.materials.length > 3 && (
                            <span className="px-2 py-1 bg-muted rounded text-xs">
                              +{artwork.materials.length - 3}
                            </span>
                          )}
                        </div>
                      )}
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
      </div>

      {/* Full Screen Modal */}
      <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-card">
          {selectedArtwork && (
            <div className="relative flex items-center justify-center h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setSelectedArtwork(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={prevArtwork}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={nextArtwork}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <div className="flex flex-col lg:flex-row items-center justify-center max-w-6xl gap-8 p-8">
                <div className="flex-1 max-w-2xl">
                  <img 
                    src={selectedArtwork.image} 
                    alt={selectedArtwork.title}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>

                <div className="flex-1 max-w-md space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{selectedArtwork.title}</h3>
                    <p className="text-xl text-muted-foreground mb-4">{selectedArtwork.medium}</p>
                    {selectedArtwork.description && (
                      <p className="text-muted-foreground">{selectedArtwork.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div>
                      <span className="text-muted-foreground">Categoria:</span>
                      <p className="font-medium capitalize">{selectedArtwork.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium">{selectedArtwork.date}</p>
                    </div>
                    {selectedArtwork.dimensions && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Dimensiuni:</span>
                        <p className="font-medium">{selectedArtwork.dimensions}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-muted-foreground">Materiale folosite:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedArtwork.materials.map((material) => (
                        <Badge key={material} variant="outline" className="bg-art-accent/10 border-art-accent/20">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TraditionalArt;