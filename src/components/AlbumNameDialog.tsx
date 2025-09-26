import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus } from 'lucide-react';

interface AlbumNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, color: string) => void;
  defaultName?: string;
}

const albumColors = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', 
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'
];

export const AlbumNameDialog: React.FC<AlbumNameDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  defaultName = 'Album nou'
}) => {
  const [name, setName] = useState(defaultName);
  const [selectedColor, setSelectedColor] = useState(albumColors[0]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim(), selectedColor);
      onOpenChange(false);
      setName(defaultName);
      setSelectedColor(albumColors[0]);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setName(defaultName);
    setSelectedColor(albumColors[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FolderPlus className="h-6 w-6 text-art-accent" />
            <DialogTitle>Creează album nou</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="album-name">Nume album</Label>
            <Input 
              id="album-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Introdu numele albumului..."
              className="focus:ring-2 focus:ring-art-accent"
            />
          </div>

          <div className="space-y-2">
            <Label>Culoare album</Label>
            <div className="flex gap-2">
              {albumColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Anulează
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="bg-art-accent hover:bg-art-accent/80"
          >
            Creează Album
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};