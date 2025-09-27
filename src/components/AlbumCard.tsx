import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2, Undo2, X, Check, Plus, Minus, Palette, Type, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  onUpdateAlbum?: (albumId: string, updates: { name?: string; color?: string; itemIds?: number[] }) => void;
}

const ITEMS_PER_PAGE = 9; // 3x3 grid

const albumColors = [
  '#7c3aed', '#f59e0b', '#10b981', '#f97316', 
  '#ef4444', '#06b6d4', '#8b5cf6', '#f97316'
];

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
  onDeleteWritingFromAlbum,
  onUpdateAlbum
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWritingsToAdd, setSelectedWritingsToAdd] = useState<Set<number>>(new Set());
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number; writingId: number } | null>(null);
  const [albumName, setAlbumName] = useState(album.name);
  const [albumColor, setAlbumColor] = useState(album.color || '#7c3aed');
  const [draggedWritingId, setDraggedWritingId] = useState<number | null>(null);
  const [editDialogPage, setEditDialogPage] = useState(0);

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
    return lines.slice(0, 2).join(' ').substring(0, 100) + (lines.length > 2 || plainText.length > 100 ? '...' : '');
  };

  // Available writings that are not in this album
  const availableWritings = allWritings.filter(w => 
    !w.deletedAt && !album.itemIds.includes(w.id)
  );

  const handleEditAlbum = () => {
    setSelectedWritingsToAdd(new Set());
    setAlbumName(album.name);
    setAlbumColor(album.color || '#7c3aed');
    setEditDialogPage(0); // Reset to first page
    setIsEditDialogOpen(true);
  };

  const handleSaveAlbum = () => {
    // Update album name and color
    onUpdateAlbum?.(album.id, { 
      name: albumName, 
      color: albumColor 
    });
    
    // Add selected writings
    if (selectedWritingsToAdd.size > 0) {
      onAddWritingsToAlbum?.(album.id, Array.from(selectedWritingsToAdd));
      setSelectedWritingsToAdd(new Set());
    }
    setIsEditDialogOpen(false);
  };

  const toggleWritingInAlbum = (writingId: number, isInAlbum: boolean) => {
    if (isInAlbum) {
      onRemoveWritingFromAlbum?.(album.id, writingId);
    } else {
      onAddWritingsToAlbum?.(album.id, [writingId]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, writingId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY, writingId });
  };

  const handleDiscardFromContext = () => {
    if (contextMenuPosition) {
      onRemoveWritingFromAlbum?.(album.id, contextMenuPosition.writingId);
      setContextMenuPosition(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, writingId: number) => {
    setDraggedWritingId(writingId);
    e.dataTransfer.setData('text/plain', writingId.toString());
  };

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!draggedWritingId || draggedWritingId === targetId) return;

    const currentItemIds = [...album.itemIds];
    const draggedIndex = currentItemIds.indexOf(draggedWritingId);
    const targetIndex = currentItemIds.indexOf(targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      currentItemIds.splice(draggedIndex, 1);
      currentItemIds.splice(targetIndex, 0, draggedWritingId);
      onUpdateAlbum?.(album.id, { itemIds: currentItemIds });
    }
    
    setDraggedWritingId(null);
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenuPosition(null);
    if (contextMenuPosition) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuPosition]);

  return (
    <>
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
                    className="p-3 bg-background/50 rounded border cursor-pointer hover:bg-background/70 transition-colors min-h-[120px] relative"
                    onClick={() => onWritingClick(writing)}
                    onContextMenu={(e) => handleContextMenu(e, writing.id)}
                    draggable={isAdmin && isExpanded}
                    onDragStart={(e) => handleDragStart(e, writing.id)}
                    onDragOver={(e) => handleDragOver(e, writing.id)}
                    onDrop={(e) => handleDrop(e, writing.id)}
                  >
                    {isAdmin && isExpanded && (
                      <div className="absolute top-1 right-1 opacity-50 hover:opacity-100">
                        <GripVertical className="h-3 w-3" />
                      </div>
                    )}
                    <h4 className="text-sm font-medium truncate mb-2">{writing.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
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
                    className="p-2 bg-background/30 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-background/50 transition-colors min-h-[120px]"
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
                            ? 'bg-primary text-primary-foreground' 
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

      {/* Context Menu */}
      {contextMenuPosition && (
        <div 
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          <button 
            onClick={handleDiscardFromContext}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
          >
            <Undo2 className="h-3 w-3" />
            Scoate din album
          </button>
        </div>
      )}

      {/* Edit Album Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Edit className="h-5 w-5" />
              Editează Album
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Album Settings */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="albumName" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Nume album
                </Label>
                <Input
                  id="albumName"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Culoare
                </Label>
                <div className="flex gap-2">
                  {albumColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setAlbumColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        albumColor === color ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Single list with album writings first, then available writings */}
            <div className="h-[400px]">
              <h3 className="font-semibold mb-3">
                Toate scrierile ({allWritings.filter(w => !w.deletedAt).length})
              </h3>
              
              {/* Combined list with pagination */}
              <div className="space-y-2 h-[320px] overflow-y-auto mb-4">
                {(() => {
                  // Create combined list: album writings first, then others
                  const albumWritingsInOrder = albumWritings;
                  const otherWritings = allWritings.filter(w => !w.deletedAt && !album.itemIds.includes(w.id));
                  const combinedWritings = [...albumWritingsInOrder, ...otherWritings];
                  
                  const EDIT_ITEMS_PER_PAGE = 10;
                  const totalEditPages = Math.ceil(combinedWritings.length / EDIT_ITEMS_PER_PAGE);
                  const currentEditPage = Math.min(Math.floor(editDialogPage || 0), Math.max(0, totalEditPages - 1));
                  const displayedWritings = combinedWritings.slice(
                    currentEditPage * EDIT_ITEMS_PER_PAGE,
                    (currentEditPage + 1) * EDIT_ITEMS_PER_PAGE
                  );
                  
                  return (
                    <>
                      {displayedWritings.map((writing) => {
                        const isInAlbum = album.itemIds.includes(writing.id);
                        return (
                          <div 
                            key={writing.id} 
                            className={`flex items-center justify-between p-3 border rounded hover:bg-muted/50 ${
                              isInAlbum ? 'bg-primary/5 border-primary/20' : ''
                            }`}
                            draggable={isInAlbum}
                            onDragStart={isInAlbum ? (e) => handleDragStart(e, writing.id) : undefined}
                            onDragOver={isInAlbum ? (e) => handleDragOver(e, writing.id) : undefined}
                            onDrop={isInAlbum ? (e) => handleDrop(e, writing.id) : undefined}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {isInAlbum && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{writing.title}</h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {getFirstVerse(writing.content) || writing.excerpt}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant={isInAlbum ? "outline" : "default"}
                                onClick={() => toggleWritingInAlbum(writing.id, isInAlbum)}
                                title={isInAlbum ? "Scoate din album" : "Adaugă în album"}
                              >
                                {isInAlbum ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              </Button>
                              {isInAlbum && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onDeleteWritingFromAlbum?.(album.id, writing.id)}
                                  title="Șterge definitiv"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {combinedWritings.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">Nu există scrieri disponibile</p>
                      )}
                      
                      {/* Pagination for edit dialog */}
                      {totalEditPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialogPage(Math.max(0, currentEditPage - 1))}
                            disabled={currentEditPage === 0}
                          >
                            ←
                          </Button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: totalEditPages }).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setEditDialogPage(index)}
                                className={`w-6 h-6 rounded text-xs transition-all ${
                                  index === currentEditPage 
                                    ? 'bg-primary text-primary-foreground' 
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
                            onClick={() => setEditDialogPage(Math.min(totalEditPages - 1, currentEditPage + 1))}
                            disabled={currentEditPage === totalEditPages - 1}
                          >
                            →
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Anulează
            </Button>
            <Button onClick={handleSaveAlbum}>
              <Check className="h-4 w-4 mr-2" />
              Salvează modificările
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};