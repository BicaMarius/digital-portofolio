import React from 'react';
import { FolderPlus, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';

interface DragDropIndicatorProps {
  type: 'merge' | 'move-left' | 'move-right' | 'move-up' | 'move-down';
  isActive: boolean;
  context?: 'grid' | 'list'; // Add context to determine orientation
}

export const DragDropIndicator: React.FC<DragDropIndicatorProps> = ({ type, isActive, context = 'grid' }) => {
  if (!isActive) return null;

  const getIndicatorContent = () => {
    switch (type) {
      case 'merge':
        return (
          <div className="flex items-center gap-2 text-art-accent">
            <FolderPlus className="h-5 w-5" />
            <span className="text-sm font-medium">Creează album</span>
          </div>
        );
      case 'move-left':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            {context === 'list' ? <ArrowUp className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            <span className="text-sm font-medium">
              {context === 'list' ? 'Mută deasupra' : 'Mută în stânga'}
            </span>
          </div>
        );
      case 'move-right':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            {context === 'list' ? <ArrowDown className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            <span className="text-sm font-medium">
              {context === 'list' ? 'Mută dedesubt' : 'Mută în dreapta'}
            </span>
          </div>
        );
      case 'move-up':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <ArrowUp className="h-5 w-5" />
            <span className="text-sm font-medium">Mută deasupra</span>
          </div>
        );
      case 'move-down':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <ArrowDown className="h-5 w-5" />
            <span className="text-sm font-medium">Mută dedesubt</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm border-2 border-dashed border-art-accent rounded-lg flex items-center justify-center z-10 animate-fade-in">
      {getIndicatorContent()}
    </div>
  );
};