import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Photo {
  id: number;
  title: string;
  device: string;
  category: 'portrait' | 'landscape' | 'street' | 'macro' | 'night';
  image: string;
  date: string;
  location?: string;
  settings?: {
    iso: string;
    aperture: string;
    shutter: string;
    focal: string;
  };
  isPrivate?: boolean;
}

const mockPhotos: Photo[] = [
  {
    id: 1,
    title: 'Sunset Mountains',
    device: 'Canon EOS R5',
    category: 'landscape',
    image: '/placeholder.svg',
    date: '2024-01-15',
    location: 'Carpații Meridionali',
    settings: {
      iso: '100',
      aperture: 'f/8',
      shutter: '1/125s',
      focal: '24mm'
    }
  },
  {
    id: 2,
    title: 'Street Portrait',
    device: 'Sony A7III',
    category: 'portrait',
    image: '/placeholder.svg',
    date: '2024-02-10',
    location: 'București',
    settings: {
      iso: '400',
      aperture: 'f/2.8',
      shutter: '1/250s',
      focal: '85mm'
    }
  },
  {
    id: 3,
    title: 'Night City',
    device: 'iPhone 15 Pro',
    category: 'night',
    image: '/placeholder.svg',
    date: '2024-03-05',
    location: 'Cluj-Napoca',
    isPrivate: true
  }
];

const Photography: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const photosPerPage = viewMode === 'grid' ? 12 : 6;

  const visiblePhotos = (isAdmin ? mockPhotos : mockPhotos.filter(photo => !photo.isPrivate))
    .filter(photo => 
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'all' || photo.category === filterCategory)
    );

  const totalPages = Math.ceil(visiblePhotos.length / photosPerPage);
  const currentPhotos = visiblePhotos.slice(
    currentPage * photosPerPage,
    (currentPage + 1) * photosPerPage
  );

  const nextPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = visiblePhotos.findIndex(p => p.id === selectedPhoto.id);
      const nextIndex = (currentIndex + 1) % visiblePhotos.length;
      setSelectedPhoto(visiblePhotos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = visiblePhotos.findIndex(p => p.id === selectedPhoto.id);
      const prevIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
      setSelectedPhoto(visiblePhotos[prevIndex]);
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
              <Camera className="h-8 w-8 text-art-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Fotografie
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Capturi artistice și momente memorabile prin obiectiv
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută fotografii..."
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
                <SelectItem value="portrait">Portret</SelectItem>
                <SelectItem value="landscape">Peisaj</SelectItem>
                <SelectItem value="street">Stradă</SelectItem>
                <SelectItem value="macro">Macro</SelectItem>
                <SelectItem value="night">Noapte</SelectItem>
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

          {/* Photos Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" 
            : "space-y-4 mb-8"
          }>
            {currentPhotos.map((photo, index) => (
              <Card 
                key={photo.id}
                className="group cursor-pointer overflow-hidden hover-scale animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <CardContent className="p-0">
                  <div className={viewMode === 'grid' ? "aspect-square" : "aspect-video md:aspect-[3/2]"}>
                    <img 
                      src={photo.image} 
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {photo.isPrivate && !isAdmin && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">Private</span>
                      </div>
                    )}
                  </div>
                  {viewMode === 'list' && (
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{photo.title}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{photo.device}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{photo.date}</span>
                        {photo.location && <span>{photo.location}</span>}
                      </div>
                    </div>
                  )}
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
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95">
          {selectedPhoto && (
            <div className="relative flex items-center justify-center h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={prevPhoto}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={nextPhoto}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <img 
                src={selectedPhoto.image} 
                alt={selectedPhoto.title}
                className="max-w-full max-h-full object-contain"
              />

              <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-4 text-white">
                <h3 className="text-xl font-semibold mb-2">{selectedPhoto.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Device:</span>
                    <p>{selectedPhoto.device}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <p>{selectedPhoto.date}</p>
                  </div>
                  {selectedPhoto.location && (
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <p>{selectedPhoto.location}</p>
                    </div>
                  )}
                  {selectedPhoto.settings && (
                    <div>
                      <span className="text-gray-400">Settings:</span>
                      <p>{selectedPhoto.settings.aperture} • {selectedPhoto.settings.shutter} • ISO {selectedPhoto.settings.iso}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Photography;