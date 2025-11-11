import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, Calendar } from 'lucide-react';
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPhoto, visiblePhotos]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Camera className="h-7 w-7 sm:h-8 sm:w-8 text-art-accent" />
              <h1 className="text-2xl sm:text-4xl font-bold gradient-text leading-tight">
                Fotografie
              </h1>
            </div>
            <p className="hidden sm:block text-xl text-muted-foreground max-w-2xl mx-auto">
              Capturi artistice și momente memorabile prin obiectiv
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută fotografii..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-10">
                <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
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

            <div className="flex gap-2 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-10 w-10"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                className="h-10 w-10"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {isAdmin && (
              <Button className="hidden sm:inline-flex h-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md">
                <Camera className="h-4 w-4 mr-2" />
                Adaugă fotografie
              </Button>
            )}
          </div>

          {/* Photos Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" 
            : "space-y-6 mb-8"
          }>
            {currentPhotos.map((photo, index) => (
              <Card 
                key={photo.id}
                className="group cursor-pointer overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <CardContent className="p-0">
                  {viewMode === 'grid' ? (
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={photo.image} 
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {photo.isPrivate && !isAdmin && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Private</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-4 p-4 sm:p-5">
                      <div className="w-32 sm:w-48 h-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={photo.image} 
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <ImageIcon className="h-5 w-5 text-art-accent flex-shrink-0 mt-0.5" />
                          <h3 className="font-semibold text-lg leading-tight">{photo.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-muted-foreground text-sm">{photo.device}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{photo.date}</span>
                          </div>
                          {photo.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{photo.location}</span>
                            </div>
                          )}
                        </div>
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
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[100vw] w-full h-full max-h-screen p-0 bg-black/98 border-0 rounded-none">
          {selectedPhoto && (
            <div className="relative w-full h-full bg-black">
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center px-3 sm:px-6 pt-6 pb-32 sm:pb-48">
                  <img
                    src={selectedPhoto.image}
                    alt={selectedPhoto.title}
                    className="w-auto h-auto max-w-full max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-260px)] object-contain"
                  />
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 sm:h-60 bg-gradient-to-t from-black via-black/85 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
                  <div className="mx-auto max-w-4xl bg-black/85 sm:bg-black/75 sm:rounded-2xl rounded-3xl backdrop-blur-sm p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <ImageIcon className="h-6 w-6 text-art-accent flex-shrink-0 mt-1" />
                      <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{selectedPhoto.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2 ml-9">
                      <Camera className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-gray-300">{selectedPhoto.device}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-9 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-300">{selectedPhoto.date}</span>
                      </div>
                      {selectedPhoto.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{selectedPhoto.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <Button
          size="icon"
          className="sm:hidden fixed bottom-5 right-5 h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
          onClick={() => {
            console.info('Add photo action');
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Photography;