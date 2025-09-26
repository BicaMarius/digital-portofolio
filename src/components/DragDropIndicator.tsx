import React from 'react';
import { FolderPlus, ArrowRight, ArrowLeft } from 'lucide-react';

interface DragDropIndicatorProps {
  type: 'merge' | 'move-left' | 'move-right';
  isActive: boolean;
}

export const DragDropIndicator: React.FC<DragDropIndicatorProps> = ({ type, isActive }) => {
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
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Mută în stânga</span>
          </div>
        );
      case 'move-right':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm font-medium">Mută în dreapta</span>
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