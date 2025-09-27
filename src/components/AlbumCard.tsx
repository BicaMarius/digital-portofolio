import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2, Undo2, X, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface WritingPiece {
  id: number;
  title: string;
  type: string;
  content: string;
  excerpt: string;
  wordCount: number;
  dateWritten: string;
  lastModified: string;
  tags: string[];
  mood: string;
  deletedAt?: string;
}

interface Album {
  id: string;
  name: string;
  color?: string;
  itemIds: number[];
}

interface AlbumCardProps {
  album: Album;
  writings: WritingPiece[];
  allWritings: WritingPiece[]; // all available writings for adding to album
  onDrop: (e: React.DragEvent, albumId: string) => void;
  onWritingClick: (writing: WritingPiece) => void;
  isAdmin: boolean;
  onDeleteAlbum?: (albumId: string) => void;
  onEditAlbum?: (albumId: string) => void;
  onDiscardAlbum?: (albumId: string) => void;
  onAddWritingsToAlbum?: (albumId: string, writingIds: number[]) => void;
  onRemoveWritingFromAlbum?: (albumId: string, writingId: number) => void;
  onDeleteWritingFromAlbum?: (albumId: string, writingId: number) => void;
}

const ITEMS_PER_PAGE = 9; // 3x3 grid

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  writings,
  allWritings,
  onDrop,
  onWritingClick,
  isAdmin,
  onDeleteAlbum,
  onEditAlbum,
  onDiscardAlbum,
  onAddWritingsToAlbum,
  onRemoveWritingFromAlbum,
  onDeleteWritingFromAlbum
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWritingsToAdd, setSelectedWritingsToAdd] = useState<Set<number>>(new Set());

  const albumWritings = writings.filter(w => album.itemIds.includes(w.id));
  const totalPages = Math.ceil(albumWritings.length / ITEMS_PER_PAGE);
  const currentWritings = albumWritings.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const previewWritings = isExpanded ? currentWritings : albumWritings.slice(0, 4);

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageClick = (page: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage(page);
  };

  // Get first verse/line from content
  const getFirstVerse = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n').filter(line => line.trim());
    return lines[0] || '';
  };

  // Available writings that are not in this album
  const availableWritings = allWritings.filter(w => 
    !w.deletedAt && !album.itemIds.includes(w.id)
  );

  const handleEditAlbum = () => {
    setSelectedWritingsToAdd(new Set());
    setIsEditDialogOpen(true);
  };

  const handleAddSelectedWritings = () => {
    if (selectedWritingsToAdd.size > 0) {
      onAddWritingsToAlbum?.(album.id, Array.from(selectedWritingsToAdd));
      setSelectedWritingsToAdd(new Set());
    }
    setIsEditDialogOpen(false);
  };

  const toggleWritingSelection = (writingId: number) => {
    const newSelection = new Set(selectedWritingsToAdd);
    if (newSelection.has(writingId)) {
      newSelection.delete(writingId);
    } else {
      newSelection.add(writingId);
    }
    setSelectedWritingsToAdd(newSelection);
  };

  return (
    <Card 
      className={`transition-all duration-300 hover:shadow-lg border-2 ${
        isExpanded ? 'col-span-2 row-span-2' : ''
      }`}
      style={{ borderColor: album.color || '#7c3aed' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, album.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: album.color || '#7c3aed' }}
            />
            <h3 className="font-semibold text-lg">{album.name}</h3>
            <Badge variant="outline" className="text-xs">
              {albumWritings.length} scrieri
            </Badge>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAlbum();
                }}
                title="Editează album"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscardAlbum?.(album.id);
                }}
                title="Desfă albumul"
              >
                <Undo2 className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAlbum?.(album.id);
                }}
                title="Șterge albumul și scrierile"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {albumWritings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Album gol</p>
            <p className="text-xs">Trage scrieri aici pentru a le adăuga</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Writing previews grid */}
            <div className={`grid gap-2 ${
              isExpanded 
                ? 'grid-cols-3' 
                : albumWritings.length === 1 
                  ? 'grid-cols-1' 
                  : albumWritings.length === 2 
                    ? 'grid-cols-2' 
                    : 'grid-cols-2'
            }`}>
              {previewWritings.map((writing, index) => (
                <div
                  key={writing.id}
                  className="p-3 bg-background/50 rounded border cursor-pointer hover:bg-background/70 transition-colors min-h-[80px]"
                  onClick={() => onWritingClick(writing)}
                >
                  <h4 className="text-sm font-medium truncate mb-1">{writing.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {getFirstVerse(writing.content) || writing.excerpt}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{writing.wordCount} cuv.</span>
                    <span className="text-xs text-muted-foreground">{writing.lastModified}</span>
                  </div>
                </div>
              ))}
              
              {/* Show "more" indicator if there are more items and not expanded */}
              {!isExpanded && albumWritings.length > 4 && (
                <div 
                  className="p-2 bg-background/30 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-background/50 transition-colors"
                  onClick={() => setIsExpanded(true)}
                >
                  <div className="text-center">
                    <MoreHorizontal className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      +{albumWritings.length - 4}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination for expanded view */}
            {isExpanded && totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => handlePageClick(index, e)}
                      className={`w-6 h-6 rounded-full text-xs transition-colors ${
                        index === currentPage 
                          ? 'bg-art-accent text-white' 
                          : 'bg-muted hover:bg-muted-foreground/20'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Collapse button for expanded view */}
            {isExpanded && (
              <div className="text-center pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsExpanded(false);
                    setCurrentPage(0);
                  }}
                >
                  Minimizează
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Album Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editează Album: {album.name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6 h-full">
            {/* Current album writings */}
            <div className="flex-1">
              <h3 className="font-semibold mb-3">Scrieri în album ({albumWritings.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {albumWritings.map(writing => (
                  <div key={writing.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{writing.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {getFirstVerse(writing.content) || writing.excerpt}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveWritingFromAlbum?.(album.id, writing.id)}
                        title="Scoate din album"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteWritingFromAlbum?.(album.id, writing.id)}
                        title="Șterge definitiv"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {albumWritings.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Album gol</p>
                )}
              </div>
            </div>

            {/* Available writings to add */}
            <div className="flex-1">
              <h3 className="font-semibold mb-3">
                Scrieri disponibile ({availableWritings.length})
                {selectedWritingsToAdd.size > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}- {selectedWritingsToAdd.size} selectate
                  </span>
                )}
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableWritings.map(writing => (
                  <div key={writing.id} className="flex items-center gap-3 p-3 border rounded">
                    <Checkbox
                      checked={selectedWritingsToAdd.has(writing.id)}
                      onCheckedChange={() => toggleWritingSelection(writing.id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{writing.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {getFirstVerse(writing.content) || writing.excerpt}
                      </p>
                    </div>
                  </div>
                ))}
                {availableWritings.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nu sunt scrieri disponibile</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handleAddSelectedWritings}
              disabled={selectedWritingsToAdd.size === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adaugă {selectedWritingsToAdd.size > 0 ? selectedWritingsToAdd.size : ''} scrieri
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};