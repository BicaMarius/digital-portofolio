import * as React from 'react';
import { X, Check, ChevronsUpDown, Plus, Trash2, Pencil, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddOption?: (name: string) => Promise<void>;
  onDeleteOption?: (value: string) => Promise<void>;
  onEditOption?: (oldValue: string, newValue: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  isAdmin?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  onAddOption,
  onDeleteOption,
  onEditOption,
  placeholder = 'Selectează...',
  className,
  isAdmin = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [newGenre, setNewGenre] = React.useState('');
  const [showManageDialog, setShowManageDialog] = React.useState(false);
  const [editingGenre, setEditingGenre] = React.useState<string | null>(null);
  const [editGenreValue, setEditGenreValue] = React.useState('');

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const handleAddGenre = async () => {
    if (!newGenre.trim() || !onAddOption) return;
    await onAddOption(newGenre.trim());
    setNewGenre('');
  };

  const handleEditGenre = async (oldName: string) => {
    if (!editGenreValue.trim() || !onEditOption) return;
    await onEditOption(oldName, editGenreValue.trim());
    // Update selected if edited genre was selected
    if (selected.includes(oldName)) {
      onChange(selected.map(v => v === oldName ? editGenreValue.trim() : v));
    }
    setEditingGenre(null);
    setEditGenreValue('');
  };

  const handleDeleteGenre = async (value: string) => {
    if (!onDeleteOption) return;
    await onDeleteOption(value);
    // Remove from selected if was selected
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    }
  };

  const startEdit = (name: string) => {
    setEditingGenre(name);
    setEditGenreValue(name);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                    {options.find((o) => o.value === value)?.label || value}
                    <X className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" />
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Caută gen..." />
            <CommandList 
              className="max-h-48 overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              <CommandEmpty>Niciun gen găsit.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {isAdmin && (onAddOption || onEditOption || onDeleteOption) && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    setShowManageDialog(true);
                    setOpen(false);
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                  Gestionează genuri
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Manage Genres Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionează genuri</DialogTitle>
            <DialogDescription>
              Adaugă, editează sau șterge genuri de filme.
            </DialogDescription>
          </DialogHeader>
          
          {/* Add new genre */}
          {onAddOption && (
            <div className="flex gap-2">
              <Input
                placeholder="Nume gen nou..."
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGenre()}
                className="flex-1"
              />
              <Button onClick={handleAddGenre} disabled={!newGenre.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
          )}

          {/* Genres list */}
          <ScrollArea className="flex-1 max-h-[50vh] pr-3">
            <div className="space-y-2">
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/30"
                >
                  {editingGenre === option.value ? (
                    <>
                      <Input
                        value={editGenreValue}
                        onChange={(e) => setEditGenreValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditGenre(option.value);
                          if (e.key === 'Escape') setEditingGenre(null);
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditGenre(option.value)}
                        className="h-8 px-2"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingGenre(null)}
                        className="h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{option.label}</span>
                      {onEditOption && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(option.value)}
                          className="h-8 w-8 p-0 hover:text-blue-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteOption && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGenre(option.value)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Nu există genuri. Adaugă primul gen!
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
