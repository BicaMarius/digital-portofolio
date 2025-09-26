import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WritingPiece {
  id: number;
  title: string;
  type: string;
  excerpt: string;
  wordCount: number;
  dateWritten: string;
  tags: string[];
  mood: string;
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
  onDrop: (e: React.DragEvent, albumId: string) => void;
  onWritingClick: (writing: WritingPiece) => void;
  isAdmin: boolean;
  onDeleteAlbum?: (albumId: string) => void;
  onEditAlbum?: (albumId: string) => void;
}

const ITEMS_PER_PAGE = 9; // 3x3 grid

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  writings,
  onDrop,
  onWritingClick,
  isAdmin,
  onDeleteAlbum,
  onEditAlbum
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

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
                onClick={() => onEditAlbum?.(album.id)}
              >
                Editează
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onDeleteAlbum?.(album.id)}
              >
                Șterge
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
                  className="p-2 bg-background/50 rounded border cursor-pointer hover:bg-background/70 transition-colors"
                  onClick={() => onWritingClick(writing)}
                >
                  <h4 className="text-xs font-medium truncate">{writing.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{writing.excerpt}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{writing.wordCount} cuv.</span>
                    <span className="text-xs text-muted-foreground">{writing.dateWritten}</span>
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
    </Card>
  );
};