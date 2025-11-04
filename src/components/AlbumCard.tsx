import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2, Undo2, X, Check, Plus, Minus, Palette, Type, GripVertical, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DragDropIndicator } from '@/components/DragDropIndicator';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onEditWriting?: (writing: WritingPiece) => void;
  isAdmin: boolean;
  onDeleteAlbum?: (albumId: string) => void;
  onEditAlbum?: (albumId: string) => void;
  onDiscardAlbum?: (albumId: string) => void;
  onAddWritingsToAlbum?: (albumId: string, writingIds: number[]) => void;
  onRemoveWritingFromAlbum?: (albumId: string, writingId: number) => void;
  onDeleteWritingFromAlbum?: (albumId: string, writingId: number) => void;
  onUpdateAlbum?: (albumId: string, updates: { name?: string; color?: string; itemIds?: number[] }) => void;
}

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
  onEditWriting,
  isAdmin,
  onDeleteAlbum,
  onEditAlbum,
  onDiscardAlbum,
  onAddWritingsToAlbum,
  onRemoveWritingFromAlbum,
  onDeleteWritingFromAlbum,
  onUpdateAlbum
}) => {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWritingsToAdd, setSelectedWritingsToAdd] = useState<Set<number>>(new Set());
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number; writingId: number } | null>(null);
  const [albumName, setAlbumName] = useState(album.name);
  const [albumColor, setAlbumColor] = useState(album.color || '#7c3aed');
  const [confirmDiscardDialog, setConfirmDiscardDialog] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Swipe state for mobile navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Long press state for mobile
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const [mobileSelectedWritingId, setMobileSelectedWritingId] = useState<number | null>(null);

  // Long press handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, writingId: number) => {
    if (!isMobile || !isAdmin) return;
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setLongPressActive(false);
    
    // Prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      setMobileSelectedWritingId(writingId);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Cancel long press if user moves finger more than 10px (scrolling)
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, writing: WritingPiece) => {
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Check if the touch ended on the mobile action bar or any of its buttons
    const target = e.target as HTMLElement;
    const isTouchingActionBar = target.closest('[data-mobile-action-bar]');
    
    // If long press was not triggered and touch didn't move much, it's a tap
    // BUT don't open the writing if mobile action bar is already open for this writing
    if (!longPressActive && touchStartPos.current) {
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // Only trigger tap if movement was minimal
      if (deltaX < 10 && deltaY < 10) {
        // Don't open writing if action bar is visible OR if touching the action bar
        if (mobileSelectedWritingId !== writing.id && !isTouchingActionBar) {
          // Tap = open writing
          onWritingClick(writing);
        } else if (mobileSelectedWritingId === writing.id && !isTouchingActionBar) {
          // Tapping the same writing again when action bar is open = close action bar
          setMobileSelectedWritingId(null);
        }
      }
    }
    
    setLongPressActive(false);
    touchStartPos.current = null;
  };

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  
  // Drag & drop state (using same logic as main writings grid)
  const dragItemId = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverType, setDragOverType] = useState<'merge' | 'move-left' | 'move-right' | null>(null);
  const [editDialogView, setEditDialogView] = useState<'album' | 'all'>('album');

  // Dynamic items per page based on device type
  const ITEMS_PER_PAGE = isMobile ? 6 : 8; // 6 for mobile (2x3), 8 for desktop (2x4)

  const albumWritings = album.itemIds
    .map(id => writings.find(w => w.id === id))
    .filter((w): w is WritingPiece => w !== undefined); // Maintain order from album.itemIds
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
    setEditDialogView('album'); // Reset to album view
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

  // Drag & drop functions (same logic as main writings grid)
  const handleDragStart = (e: React.DragEvent, id: number) => {
    dragItemId.current = id;
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to album's onDragOver
    
    const draggedId = dragItemId.current;
    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Determine drop zone based on mouse position - only left/right for albums, no merge
    if (x < width * 0.5) {
      setDragOverType('move-left');
      setDragOverId(targetId);
    } else {
      setDragOverType('move-right'); 
      setDragOverId(targetId);
    }
  };

  const handleDropOnCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to album's onDrop
    
    const sourceId = dragItemId.current;
    const currentDragOverType = dragOverType; // Save before resetting
    
    dragItemId.current = null;
    setDragOverId(null);
    setDragOverType(null);

    if (!sourceId || sourceId === targetId) return;

    // Reorder writings within album (no merge functionality in albums)
    const direction = currentDragOverType === 'move-left' ? 'before' : 'after';
    reorderWritings(sourceId, targetId, direction);
  };

  const reorderWritings = (sourceId: number, targetId: number, direction: 'before' | 'after') => {
    const currentItemIds = [...album.itemIds];
    const sourceIndex = currentItemIds.findIndex(id => id === sourceId);
    const targetIndex = currentItemIds.findIndex(id => id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const [item] = currentItemIds.splice(sourceIndex, 1);
    const insertIndex = direction === 'before' ? targetIndex : targetIndex + 1;
    currentItemIds.splice(insertIndex > sourceIndex ? insertIndex - 1 : insertIndex, 0, item);
    
    onUpdateAlbum?.(album.id, { itemIds: currentItemIds });
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setDragOverType(null);
  };

  // Drag & drop functions specifically for edit dialog (vertical logic)
  const handleDragOverCardEditDialog = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to album's onDragOver
    
    const draggedId = dragItemId.current;
    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Determine drop zone based on vertical mouse position
    if (y < height * 0.5) {
      setDragOverType('move-left'); // Reuse 'move-left' to mean 'above'
      setDragOverId(targetId);
    } else {
      setDragOverType('move-right'); // Reuse 'move-right' to mean 'below'
      setDragOverId(targetId);
    }
  };

  const handleDropOnCardEditDialog = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to album's onDrop
    
    const sourceId = dragItemId.current;
    const currentDragOverType = dragOverType; // Save before resetting
    
    dragItemId.current = null;
    setDragOverId(null);
    setDragOverType(null);

    if (!sourceId || sourceId === targetId) return;

    // Reorder writings within album (vertical logic: above/below)
    const direction = currentDragOverType === 'move-left' ? 'before' : 'after'; // 'move-left' = above, 'move-right' = below
    reorderWritings(sourceId, targetId, direction);
  };

  // Swipe handlers for mobile navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !isExpanded) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isExpanded) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !isExpanded || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      // Swipe left = next page
      setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    }
    if (isRightSwipe && currentPage > 0) {
      // Swipe right = previous page
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
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
        className={`transition-all duration-300 hover:shadow-lg border-2 w-full max-w-none`}
        style={{ borderColor: album.color || '#7c3aed' }}
        onDragOver={!isMobile ? (e) => e.preventDefault() : undefined}
        onDrop={!isMobile ? (e) => onDrop(e, album.id) : undefined}
      >
        <CardContent className="p-4">
          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'} mb-3`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: album.color || '#7c3aed' }}
              />
              <h3 className="font-semibold text-lg truncate">{album.name}</h3>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {albumWritings.length} scrieri
              </Badge>
            </div>
            
            {isAdmin && (
              <div className={`flex ${isMobile ? 'flex-wrap justify-center gap-2' : 'gap-1'} ${isMobile ? 'justify-center' : 'flex-shrink-0'}`}>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAlbum();
                  }}
                  title="Editează album"
                  className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 touch-manipulation`}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Album discard button clicked, album id:', album.id);
                    setConfirmDiscardDialog(true);
                  }}
                  title="Desfă albumul"
                  className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 touch-manipulation`}
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
                  className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 touch-manipulation`}
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
            <div className="space-y-4">
              {/* Writing previews grid - compact consistent spacing */}
              <div 
                className={`grid gap-3 ${
                  isExpanded 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : albumWritings.length === 1 
                      ? 'grid-cols-1' 
                      : 'grid-cols-2'
                }`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {previewWritings.map((writing, index) => (
                  <div
                    key={writing.id}
                    className={`p-3 bg-background/50 rounded border cursor-pointer hover:bg-background/70 transition-colors relative ${
                      isExpanded ? (isMobile ? 'min-h-[100px]' : 'min-h-[140px]') : (isMobile ? 'min-h-[80px]' : 'min-h-[110px]')
                    } ${mobileSelectedWritingId === writing.id ? 'ring-2 ring-primary/60' : ''}`}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                    {...(isMobile ? {
                      onTouchStart: (e) => handleTouchStart(e, writing.id),
                      onTouchMove: handleTouchMove,
                      onTouchEnd: (e) => handleTouchEnd(e, writing)
                    } : {
                      onClick: () => onWritingClick(writing)
                    })}
                    {...(!isMobile && {
                      onContextMenu: (e) => {
                        if (!isAdmin) { e.preventDefault(); return; }
                        handleContextMenu(e, writing.id);
                      }
                    })}
                    onDragOver={isAdmin && isExpanded ? (e) => handleDragOverCard(e, writing.id) : undefined}
                    onDrop={isAdmin && isExpanded ? (e) => handleDropOnCard(e, writing.id) : undefined}
                    onDragLeave={isAdmin && isExpanded ? handleDragLeave : undefined}
                  >
                    {/* Drag Drop Indicator */}
                    {isAdmin && isExpanded && dragOverId === writing.id && (
                      <DragDropIndicator 
                        type={dragOverType!} 
                        isActive={true}
                        context="grid"
                      />
                    )}
                    
                    {/* Mobile action bar pentru scrieri din albumuri */}
                    {mobileSelectedWritingId === writing.id && isMobile && isAdmin && (
                      <div data-mobile-action-bar="true" className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/95 backdrop-blur px-2 py-1 rounded-full shadow border border-border animate-fade-in">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          title="Scoate din album" 
                          onClick={(e) => { e.stopPropagation(); onRemoveWritingFromAlbum?.(album.id, writing.id); setMobileSelectedWritingId(null); }}
                          onTouchEnd={(e) => { e.stopPropagation(); }}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          title="Editează" 
                          onClick={(e) => { e.stopPropagation(); onEditWriting?.(writing); setMobileSelectedWritingId(null); }}
                          onTouchEnd={(e) => { e.stopPropagation(); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive" 
                          title="Șterge" 
                          onClick={(e) => { e.stopPropagation(); onDeleteWritingFromAlbum?.(album.id, writing.id); setMobileSelectedWritingId(null); }}
                          onTouchEnd={(e) => { e.stopPropagation(); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          title="Închide" 
                          onClick={(e) => { e.stopPropagation(); setMobileSelectedWritingId(null); }}
                          onTouchEnd={(e) => { e.stopPropagation(); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {isAdmin && isExpanded && (
                      <span
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, writing.id)}
                        className="absolute top-2 right-2 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                    )}
                    
                    <div className="mb-2">
                      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-1 line-clamp-2 pr-6`}>{writing.title}</h4>
                      <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground mb-2 flex items-center gap-1`}>
                        {isMobile ? (
                          // Compact mobile format: 25mai | 20 (icon)
                          <>
                            <span>{writing.dateWritten}</span>
                            <span>|</span>
                            <span className="flex items-center gap-1">
                              {writing.wordCount}
                              <FileText className="h-2.5 w-2.5" />
                            </span>
                          </>
                        ) : (
                          // Desktop format
                          <>
                            <span>{writing.dateWritten}</span>
                            <span>{writing.wordCount} cuvinte</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground line-clamp-2 mb-2 leading-relaxed`}>
                      {getFirstVerse(writing.content) || writing.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs mt-auto">
                      <Badge variant="outline" className={`${isMobile ? 'text-[9px] px-1 py-0' : 'text-[10px] px-1 py-0.5'}`}>
                        {writing.type === 'poetry' ? 'Poezie' : 
                         writing.type === 'short-story' ? 'Povestire' : 
                         writing.type === 'essay' ? 'Eseu' : writing.type}
                      </Badge>
                      {!isExpanded && !isMobile && (
                        <span className="text-muted-foreground text-[10px]">{writing.mood}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show "more" indicator if there are more items and not expanded */}
                {!isExpanded && albumWritings.length > 4 && (
                  <div 
                    className="p-3 bg-background/30 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-background/50 transition-colors min-h-[110px]"
                    onClick={() => setIsExpanded(true)}
                  >
                    <div className="text-center">
                      <MoreHorizontal className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        +{albumWritings.length - 4} scrieri
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed position controls for expanded view */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    {/* Pagination - always stays at bottom */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
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

                    {/* Minimize button - always on the right */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsExpanded(false);
                        setCurrentPage(0);
                      }}
                      className="ml-auto flex items-center gap-1 text-xs px-2 py-1 h-auto"
                      title="Minimizează"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      {contextMenuPosition && (
        <div 
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 backdrop-blur-sm"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          <button 
            onClick={handleDiscardFromContext}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
          >
            <Undo2 className="h-3 w-3" />
            Scoate din album
          </button>
          {onEditWriting && (
            <button 
              onClick={() => {
                if (contextMenuPosition) {
                  const writing = writings.find(w => w.id === contextMenuPosition.writingId);
                  if (writing) onEditWriting(writing);
                  setContextMenuPosition(null);
                }
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <Edit className="h-3 w-3" />
              Editează
            </button>
          )}
          <button 
            onClick={() => {
              if (contextMenuPosition) {
                onDeleteWritingFromAlbum?.(album.id, contextMenuPosition.writingId);
                setContextMenuPosition(null);
              }
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Șterge
          </button>
        </div>
      )}

      {/* Edit Album Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[85vh] sm:max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <Edit className="h-5 w-5" />
              Editează Album
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 pb-4">
            {/* Album Settings */}
            <div className="grid grid-cols-1 gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="albumName" className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4" />
                  Nume album
                </Label>
                <Input
                  id="albumName"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4" />
                  Culoare
                </Label>
                <div className="flex gap-1.5 flex-wrap">
                  {albumColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setAlbumColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
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
              <div className="space-y-2 h-[320px] overflow-y-auto mb-4 theme-scrollbar">
                {(() => {
                  // Create combined list: album writings first, then others
                  const albumWritingsInOrder = albumWritings;
                  const otherWritings = allWritings.filter(w => !w.deletedAt && !album.itemIds.includes(w.id));
                  const combinedWritings = [...albumWritingsInOrder, ...otherWritings];
                  
                  const EDIT_ITEMS_PER_PAGE = 10;
                  const totalEditPages = Math.ceil(combinedWritings.length / EDIT_ITEMS_PER_PAGE);
                  const currentEditPage = 0;
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
                            className={`flex items-center justify-between p-2 border rounded hover:bg-muted/50 ${
                              isInAlbum ? 'bg-primary/5 border-primary/20' : ''
                            } cursor-pointer relative`}
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                            onDragOver={isInAlbum ? (e) => handleDragOverCardEditDialog(e, writing.id) : undefined}
                            onDrop={isInAlbum ? (e) => handleDropOnCardEditDialog(e, writing.id) : undefined}
                            onDragLeave={isInAlbum ? handleDragLeave : undefined}
                            {...(isMobile ? {
                              onTouchStart: (e) => handleTouchStart(e, writing.id),
                              onTouchMove: handleTouchMove,
                              onTouchEnd: (e) => handleTouchEnd(e, writing)
                            } : {
                              onClick: () => onWritingClick(writing)
                            })}
                          >
                            {/* Drag Drop Indicator */}
                            {isInAlbum && dragOverId === writing.id && (
                              <DragDropIndicator 
                                type={dragOverType!} 
                                isActive={true}
                                context="list"
                              />
                            )}
                            <div className={`flex items-center gap-2 flex-1 min-w-0 ${isMobile ? 'pr-1' : ''}`}>
                              {isInAlbum && (
                                <span
                                  className="active:cursor-grabbing cursor-grab flex-shrink-0"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, writing.id)}
                                  title="Trage pentru a reordona"
                                >
                                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium ${isMobile ? 'text-[11px]' : 'text-xs'} leading-tight truncate`}>{writing.title}</h4>
                                <p className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-muted-foreground truncate leading-tight`}>
                                  {(getFirstVerse(writing.content)?.substring(0, isMobile ? 30 : 50) || writing.excerpt?.substring(0, isMobile ? 30 : 50))}...
                                </p>
                              </div>
                            </div>
                            <div 
                              data-mobile-action-bar="true" 
                              className={`flex gap-1 flex-shrink-0 ${isMobile ? 'flex-col' : ''}`} 
                              onClick={(e) => e.stopPropagation()}
                              onTouchEnd={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                variant={isInAlbum ? "outline" : "default"}
                                onClick={() => toggleWritingInAlbum(writing.id, isInAlbum)}
                                onTouchEnd={(e) => e.stopPropagation()}
                                title={isInAlbum ? "Scoate din album" : "Adaugă în album"}
                                className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0`}
                              >
                                {isInAlbum ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => onEditWriting?.(writing)} 
                                onTouchEnd={(e) => e.stopPropagation()}
                                title="Editează" 
                                className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0`}
                              >
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                              {isInAlbum && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onDeleteWritingFromAlbum?.(album.id, writing.id)}
                                  onTouchEnd={(e) => e.stopPropagation()}
                                  title="Șterge definitiv"
                                  className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0`}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {combinedWritings.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">Nu există scrieri disponibile</p>
                      )}
                      
                      {/* Pagination removed for simplicity */}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background z-10 flex justify-between gap-2 pt-3 border-t mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 text-xs h-8">
              <X className="h-3 w-3 mr-1" />
              Anulează
            </Button>
            <Button onClick={handleSaveAlbum} className="flex-1 text-xs h-8">
              <Check className="h-3 w-3 mr-1" />
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for album discard */}
      <ConfirmationDialog
        open={confirmDiscardDialog}
        onOpenChange={setConfirmDiscardDialog}
        title="Desfă albumul"
        message={`Ești sigur că vrei să desfaci albumul "${album.name}"? Scrierile se vor întoarce în biblioteca principală.`}
        type="info"
        confirmText="Desfă albumul"
        cancelText="Anulează"
        onConfirm={() => {
          console.log('Confirming album discard...');
          console.log('onDiscardAlbum function available:', typeof onDiscardAlbum);
          console.log('onDiscardAlbum function:', onDiscardAlbum);
          console.log('About to call onDiscardAlbum with:', album.id);
          try {
            if (onDiscardAlbum) {
              onDiscardAlbum(album.id);
              console.log('onDiscardAlbum called successfully');
            } else {
              console.error('onDiscardAlbum is not available');
            }
          } catch (error) {
            console.error('Error calling onDiscardAlbum:', error);
          }
          setConfirmDiscardDialog(false);
          console.log('Dialog closed');
        }}
        onCancel={() => {
          console.log('Cancelling album discard...');
          setConfirmDiscardDialog(false);
        }}
      />
    </>
  );
};