import React, { useState } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProjectSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterPrivacy: string;
  setFilterPrivacy: (privacy: string) => void;
  projectTypes: Array<{ value: string; label: string }>;
  isAdmin: boolean;
  onAddProject: () => void;
}

export const ProjectSearchFilter: React.FC<ProjectSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterPrivacy,
  setFilterPrivacy,
  projectTypes,
  isAdmin,
  onAddProject,
}) => {
  const isMobile = useIsMobile();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = filterType !== 'all' || filterPrivacy !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterPrivacy('all');
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="filterType">Tip Proiect</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger id="filterType">
            <SelectValue placeholder="Toate tipurile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            {projectTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <div>
          <Label htmlFor="filterPrivacy">Vizibilitate</Label>
          <Select value={filterPrivacy} onValueChange={setFilterPrivacy}>
            <SelectTrigger id="filterPrivacy">
              <SelectValue placeholder="Toate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="public">Publice</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Resetează Filtrele
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută proiecte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Sheet */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtrează Proiecte</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Add Button (Admin only) */}
        {isAdmin && (
          <Button 
            onClick={onAddProject}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Proiect
          </Button>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Caută proiecte (titlu, descriere, tehnologii, tag-uri)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Type Filter */}
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Toate tipurile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate tipurile</SelectItem>
          {projectTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Privacy Filter (Admin only) */}
      {isAdmin && (
        <Select value={filterPrivacy} onValueChange={setFilterPrivacy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Toate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="public">Publice</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Resetează
        </Button>
      )}

      {/* Add Button (Admin only) */}
      {isAdmin && (
        <Button 
          onClick={onAddProject}
          className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Proiect
        </Button>
      )}
    </div>
  );
};
