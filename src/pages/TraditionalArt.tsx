import React, { useMemo, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Plus, Search, Filter, ChevronLeft, ChevronRight, Palette, Brush, Images, Grid3X3, List, ChevronsUpDown, Edit } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AlbumCoverDialog from '@/components/AlbumCoverDialog';
import { getAlbums as apiGetAlbums, createAlbum as apiCreateAlbum, updateAlbum as apiUpdateAlbum } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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

interface TraditionalAlbum {
  id: number;
  title: string;
  cover: string;
  artworks: TraditionalArtwork[];
  coverPos?: { x: number; y: number };
  coverScale?: number;
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
  // Album UX state
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridPage, setGridPage] = useState(0);
  const GRID_PER_PAGE = 24;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandAll, setExpandAll] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<TraditionalAlbum | null>(null);

  // Seed albums from artworks (demo): group by category and add a mixed album
  const seedAlbums: TraditionalAlbum[] = useMemo(() => {
    const visible = (isAdmin ? mockArtworks : mockArtworks.filter(a => !a.isPrivate));
    const byCategory = (category: TraditionalArtwork['category'], title: string, id: number): TraditionalAlbum => ({
      id,
      title,
      cover: '/placeholder.svg',
      artworks: visible.filter(a => a.category === category),
    });
    const mixed: TraditionalAlbum = {
      id: 99,
      title: 'Portofoliu mixt',
      cover: '/placeholder.svg',
      artworks: visible,
    };
    return [
      byCategory('drawing', 'Desene', 1),
      byCategory('painting', 'Picturi', 2),
      byCategory('portrait', 'Portrete', 3),
      byCategory('landscape', 'Peisaje', 4),
      mixed,
    ].filter(alb => alb.artworks.length > 0);
  }, [isAdmin]);

  const [albums, setAlbums] = useState<TraditionalAlbum[]>(seedAlbums);
  const [dbApplied, setDbApplied] = useState(false);

  // Sync albums when seed changes (e.g., admin toggle affects visibility)
  React.useEffect(() => {
    setAlbums(seedAlbums);
  }, [seedAlbums]);

  // Optional DB overrides for title/cover/position while keeping mock artworks
  React.useEffect(() => {
    if (dbApplied) return;
    (async () => {
      try {
        const list = await apiGetAlbums();
        setAlbums(prev => prev.map(a => {
          const match = (list as any[]).find(x => x.name === a.title);
          if (!match) return a;
          const { url, pos, scale } = parseIconWithPos(match.icon || '');
          return { ...a, title: match.name || a.title, cover: url || a.cover, coverPos: pos || a.coverPos, coverScale: scale ?? a.coverScale };
        }));
      } catch (e) {
        console.warn('DB albums not available; staying on mock-only covers');
      } finally {
        setDbApplied(true);
      }
    })();
  }, [dbApplied]);

  // Initialize expanded state (default: all expanded)
  React.useEffect(() => {
    const all = new Set(albums.map(a => a.id));
    setExpandedAlbumIds(all);
    setExpandAll(true);
    setGridPage(0);
  }, [albums.length]);

  // When switching views, reset pagination to first page
  React.useEffect(() => {
    setGridPage(0);
  }, [viewMode]);

  const filteredAlbums = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return albums
      .map(album => ({
        ...album,
        artworks: album.artworks.filter(a =>
          a.title.toLowerCase().includes(term) && (filterCategory === 'all' || a.category === filterCategory)
        ),
      }))
      .filter(a => a.artworks.length > 0 || albumMatchesTitle(a.title, term));
  }, [albums, searchTerm, filterCategory]);

  const albumMatchesTitle = (title: string, term: string) => title.toLowerCase().includes(term);

  // Navigation between all visible artworks (flattened)
  const flatVisibleArtworks = useMemo(() => filteredAlbums.flatMap(a => a.artworks), [filteredAlbums]);
  const nextArtwork = () => {
    if (selectedArtwork && flatVisibleArtworks.length) {
      const currentIndex = flatVisibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const nextIndex = (currentIndex + 1) % flatVisibleArtworks.length;
      setSelectedArtwork(flatVisibleArtworks[nextIndex]);
    }
  };

  const prevArtwork = () => {
    if (selectedArtwork && flatVisibleArtworks.length) {
      const currentIndex = flatVisibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const prevIndex = (currentIndex - 1 + flatVisibleArtworks.length) % flatVisibleArtworks.length;
      setSelectedArtwork(flatVisibleArtworks[prevIndex]);
    }
  };

  function parseIconWithPos(icon: string): { url: string; pos?: { x: number; y: number }; scale?: number } {
    if (!icon) return { url: '' };
    const [url, hash] = icon.split('#');
    if (!hash) return { url };
    const params = new URLSearchParams(hash);
    const x = Number(params.get('x'));
    const y = Number(params.get('y'));
    const s = Number(params.get('s'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { url };
    const out: any = { url, pos: { x, y } };
    if (Number.isFinite(s) && s > 0) out.scale = s;
    return out;
  }

  function buildIconWithPos(url: string, pos?: { x: number; y: number }, scale?: number) {
    if (!url) return '';
    if (!pos) return url;
    const params = new URLSearchParams({ x: String(Math.round(pos.x)), y: String(Math.round(pos.y)) });
    if (scale && scale !== 1) params.set('s', String(Number(scale.toFixed(2))));
    return `${url}#${params.toString()}`;
  }
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

          {/* Controls - responsive single-row on small screens */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută albume sau lucrări..."
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
                <SelectItem value="drawing">Desenuri</SelectItem>
                <SelectItem value="painting">Picturi</SelectItem>
                <SelectItem value="sketch">Schițe</SelectItem>
                <SelectItem value="portrait">Portrete</SelectItem>
                <SelectItem value="landscape">Peisaje</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex gap-1">
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
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Switch
                checked={expandAll}
                onCheckedChange={(checked) => {
                  setExpandAll(!!checked);
                  setExpandedAlbumIds(checked ? new Set(albums.map(a => a.id)) : new Set());
                }}
              />
            </div>

            {isAdmin && (
              <Button className="h-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md">
                <Brush className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adaugă Operă</span>
                <span className="sm:hidden">Adaugă</span>
              </Button>
            )}
          </div>

          {viewMode === 'list' ? (
            // LIST VIEW: vertical albums with nested image grid
            <div className="space-y-4">
              {filteredAlbums.map((album) => {
                const isExpanded = expandedAlbumIds.has(album.id);
                return (
                  <div key={album.id} className="border border-border/60 rounded-xl overflow-hidden">
                    {/* Album header */
                    }
                    <button
                      aria-expanded={isExpanded}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        const next = new Set(expandedAlbumIds);
                        if (next.has(album.id)) next.delete(album.id); else next.add(album.id);
                        setExpandedAlbumIds(next);
                        setExpandAll(next.size === albums.length);
                      }}
                    >
                      <div className="relative w-12 h-12">
                        <div className="absolute -left-1 -top-1 w-10 h-10 rounded bg-muted border border-border/70" />
                        <div className="absolute -right-1 -bottom-1 w-10 h-10 rounded bg-muted border border-border/70" />
                        <div className="absolute inset-0 rounded overflow-hidden border border-border">
                          <img src={album.cover} alt={album.title} className="w-full h-full object-cover opacity-90" style={{ ...(album.coverPos ? { objectPosition: `${album.coverPos.x}% ${album.coverPos.y}%` } : {}), ...(album.coverScale ? { transform: `scale(${album.coverScale})`, transformOrigin: `${album.coverPos?.x ?? 50}% ${album.coverPos?.y ?? 50}%` } : {}) }} />
                        </div>
                        <span className="absolute -right-2 -top-2 text-xs bg-background border border-border rounded-full px-1">{album.artworks.length}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{album.title}</h3>
                          <Badge variant="outline" className="bg-art-accent/10 border-art-accent/20 text-xs">
                            <Images className="h-3 w-3 mr-1" /> {album.artworks.length}
                          </Badge>
                          {isAdmin && (
                            <span className="ml-auto">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Click pentru a {isExpanded ? 'închide' : 'extinde'} albumul</p>
                      </div>
                    </button>

                    {/* Images strip */}
                    <div className={`px-4 pb-4 transition-[max-height] duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'} overflow-hidden`}>
                      <div className="flex flex-wrap gap-3 pt-2 justify-center sm:justify-start">
                        {album.artworks.map((artwork, i) => (
                          <Card
                            key={artwork.id}
                            className="group cursor-pointer overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300"
                            style={{ transitionDelay: isExpanded ? `${i * 40}ms` : '0ms', opacity: isExpanded ? 1 : 0, transform: isExpanded ? 'translateX(0)' : 'translateX(-12px)' }}
                            onClick={() => setSelectedArtwork(artwork)}
                          >
                            <CardContent className="p-0">
                              <div className="w-[160px] h-[120px] sm:w-[200px] sm:h-[150px] overflow-hidden">
                                <img
                                  src={artwork.image}
                                  alt={artwork.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="px-3 py-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[160px]">{artwork.title}</span>
                                  <Badge className="bg-art-accent/20 text-art-accent ml-2" variant="outline">
                                    <span className="flex items-center gap-1">
                                      {getCategoryIcon(artwork.category)}
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{artwork.medium}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // GRID VIEW: wrapped rows with pagination
            <>
              {(() => {
                const flattened = filteredAlbums.flatMap((album) => {
                  const isExpanded = expandedAlbumIds.has(album.id);
                  const parts: Array<{ key: string; node: React.ReactNode }> = [];
                  parts.push({
                    key: `album-${album.id}`,
                    node: (
                      <Card key={`album-${album.id}`} className="group overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300 min-w-[160px] relative">
                        <CardContent className="p-0">
                          <button
                            aria-expanded={isExpanded}
                            className="relative w-[160px] h-[160px] sm:w-[220px] sm:h-[300px]"
                            onClick={() => {
                              const next = new Set(expandedAlbumIds);
                              if (next.has(album.id)) next.delete(album.id); else next.add(album.id);
                              setExpandedAlbumIds(next);
                              setExpandAll(next.size === albums.length);
                            }}
                          >
                            {/* Cover image with subtle stacked sheets */}
                            <div className="absolute -left-2 -top-2 w-10 h-10 rounded bg-muted border border-border/70 hidden sm:block" />
                            <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded bg-muted border border-border/70 hidden sm:block" />
                            <div className="absolute inset-0 bg-muted">
                              <img src={album.cover} alt={album.title} className="w-full h-full object-cover" style={{ ...(album.coverPos ? { objectPosition: `${album.coverPos.x}% ${album.coverPos.y}%` } : {}), ...(album.coverScale ? { transform: `scale(${album.coverScale})`, transformOrigin: `${album.coverPos?.x ?? 50}% ${album.coverPos?.y ?? 50}%` } : {}) }} />
                            </div>
                            {!isExpanded && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur px-2 py-2 text-sm flex items-center justify-between">
                              <span className="font-medium truncate max-w-[160px] sm:max-w-[200px]">{album.title}</span>
                              <span className="ml-2 flex items-center gap-1"><Images className="h-3 w-3" />{album.artworks.length}</span>
                            </div>
                          </button>
                          {isAdmin && (
                            <div className="absolute top-1 right-1 z-10">
                              <Button size="icon" variant="secondary" className="h-7 w-7 opacity-90 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ),
                  });
                  if (isExpanded) {
                    album.artworks.forEach((artwork, i) => {
                      parts.push({
                        key: `art-${album.id}-${artwork.id}`,
                        node: (
                          <Card
                            key={`art-${album.id}-${artwork.id}`}
                            className="group cursor-pointer overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300 min-w-[160px]"
                            style={{ transitionDelay: `${i * 40}ms`, opacity: 1, transform: 'translateX(0)' }}
                            onClick={() => setSelectedArtwork(artwork)}
                          >
                            <CardContent className="p-0">
                              <div className="w-[160px] h-[160px] sm:w-[220px] sm:h-[300px] overflow-hidden">
                                <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      });
                    });
                  }
                  return parts;
                });

                const totalPages = Math.max(1, Math.ceil(flattened.length / GRID_PER_PAGE));
                const safePage = Math.min(gridPage, totalPages - 1);
                if (safePage !== gridPage) setGridPage(safePage);
                const pageItems = flattened.slice(safePage * GRID_PER_PAGE, (safePage + 1) * GRID_PER_PAGE);

                return (
                  <>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {pageItems.map((it) => (
                        <div key={it.key}>{it.node}</div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" onClick={() => setGridPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-muted-foreground">{safePage + 1} din {totalPages}</span>
                        <Button variant="outline" onClick={() => setGridPage(Math.min(totalPages - 1, safePage + 1))} disabled={safePage === totalPages - 1}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {/* Note: Pagination no longer needed in albums layout */}
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

      {/* Admin: Edit album title/cover and manage items */}
      {isAdmin && (
        <AlbumCoverDialog
          open={!!editingAlbum}
          onOpenChange={(open) => !open && setEditingAlbum(null)}
          album={editingAlbum as any}
          onSave={async (updates) => {
            if (!editingAlbum) return;
            const newTitle = updates.title ?? editingAlbum.title;
            const newCover = updates.cover ?? editingAlbum.cover;
            const iconWithPos = buildIconWithPos(newCover, updates.coverPos, (updates as any).coverPosScale ?? updates.coverScale);
            try {
              const list = await apiGetAlbums().catch(() => [] as any[]);
              const match: any = (list as any[]).find(x => x.name === editingAlbum.title) || null;
              if (match) {
                await apiUpdateAlbum(match.id, { name: newTitle, icon: iconWithPos });
              } else {
                await apiCreateAlbum({ name: newTitle, itemIds: [], icon: iconWithPos } as any);
              }
            } catch (e) {
              console.warn('Failed to persist album cover/title; keeping local update only', e);
            }
            setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? { ...a, title: newTitle, cover: newCover, coverPos: updates.coverPos ?? a.coverPos, coverScale: ((updates as any).coverPosScale ?? updates.coverScale) ?? a.coverScale } : a));
            setEditingAlbum(null);
          }}
          onRemoveFromAlbum={(artworkId) => {
            if (!editingAlbum) return;
            setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? { ...a, artworks: a.artworks.filter(w => w.id !== artworkId) } : a));
          }}
          onDeleteArtwork={(artworkId) => {
            // For demo: remove from this album only
            if (!editingAlbum) return;
            setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? { ...a, artworks: a.artworks.filter(w => w.id !== artworkId) } : a));
          }}
        />
      )}
    </div>
  );
};

export default TraditionalArt;