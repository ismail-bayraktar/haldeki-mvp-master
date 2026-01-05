// Search Bar Component for Suppliers (Phase 9 - Mobile First)

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilterModal } from '@/components/supplier/FilterModal';
import type { ProductSearchFilters, ProductSortOption } from '@/types/supplier';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  filters: ProductSearchFilters;
  onFiltersChange: (filters: ProductSearchFilters) => void;
  activeFilterCount: number;
  sortBy: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
  recentSearches: Array<{ query: string; timestamp: string }>;
  onRecentSearchClick: (query: string) => void;
  className?: string;
}

const SORT_OPTIONS: Array<{ value: ProductSortOption; label: string }> = [
  { value: 'modified_desc', label: 'En son güncellenen' },
  { value: 'name_asc', label: 'İsim (A-Z)' },
  { value: 'name_desc', label: 'İsim (Z-A)' },
  { value: 'price_asc', label: 'Fiyat (Artan)' },
  { value: 'price_desc', label: 'Fiyat (Azalan)' },
  { value: 'stock_desc', label: 'Stok (Çoktan aza)' },
];

export function SearchBar({
  value,
  onChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  sortBy,
  onSortChange,
  recentSearches,
  onRecentSearchClick,
  className,
}: SearchBarProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleOpenSearch = () => {
    setIsSearchModalOpen(true);
    setInputValue(value);
  };

  const handleCloseSearch = () => {
    setIsSearchModalOpen(false);
  };

  const handleApplySearch = () => {
    onChange(inputValue);
    setIsSearchModalOpen(false);
  };

  const handleClearSearch = () => {
    setInputValue('');
    onChange('');
  };

  const handleClearRecent = () => {
    // This would be passed from parent
    recentSearches = [];
  };

  return (
    <>
      <div className={cn('flex gap-2', className)}>
        {/* Search Input - Opens Modal on Mobile */}
        <Button
          variant="outline"
          className="flex-1 justify-start text-muted-foreground h-10"
          onClick={handleOpenSearch}
        >
          <Search className="h-4 w-4 mr-2" />
          {value || 'Ürün ara...'}
        </Button>

        {/* Filter Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 relative"
          onClick={() => setIsFilterModalOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search Modal (Mobile Full-Screen) */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Ara</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ürün adı..."
                className="pl-10 pr-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplySearch();
                  }
                }}
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !inputValue && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Son Aramalar</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs text-muted-foreground"
                    onClick={handleClearRecent}
                  >
                    Temizle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(search.query);
                        onChange(search.query);
                        setIsSearchModalOpen(false);
                        onRecentSearchClick(search.query);
                      }}
                      className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                    >
                      {search.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Sıralama</p>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm text-left transition-colors',
                      sortBy === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseSearch}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplySearch}
              >
                Ara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <FilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </>
  );
}
