// Search Bar Component for Suppliers (Phase 9 - Mobile First)

import { useState, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  onClearRecentSearches,
  className,
}: SearchBarProps & { onClearRecentSearches?: () => void }) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsDropdownOpen(true);
    setFocusedIndex(-1);
  };

  const handleClearSearch = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (query: string) => {
    setInputValue(query);
    onChange(query);
    setIsDropdownOpen(false);
    onRecentSearchClick(query);
    inputRef.current?.focus();
  };

  const handleSortChange = (sort: ProductSortOption) => {
    onSortChange(sort);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = getDropdownItems();

    if (!isDropdownOpen || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          items[focusedIndex].onClick();
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const getDropdownItems = () => {
    const items: Array<{ type: 'recent' | 'sort'; label: string; onClick: () => void }> = [];

    if (!inputValue && recentSearches.length > 0) {
      recentSearches.slice(0, 5).forEach((search) => {
        items.push({
          type: 'recent',
          label: search.query,
          onClick: () => handleRecentSearchClick(search.query),
        });
      });
    }

    SORT_OPTIONS.forEach((option) => {
      items.push({
        type: 'sort',
        label: option.label,
        onClick: () => handleSortChange(option.value),
      });
    });

    return items;
  };

  const dropdownItems = getDropdownItems();
  const hasRecentSearches = recentSearches.length > 0 && !inputValue;

  return (
    <>
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Ürün ara..."
              className="pl-10 pr-10 h-10"
            />
            {value && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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

        {/* Inline Dropdown */}
        {isDropdownOpen && dropdownItems.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-h-80 overflow-y-auto">
              {hasRecentSearches && (
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Son Aramalar</p>
                    {onClearRecentSearches && (
                      <button
                        onClick={onClearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 5).map((search, index) => {
                      const globalIndex = index;
                      return (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search.query)}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                          className={cn(
                            'px-3 py-1.5 bg-muted rounded-full text-sm transition-colors',
                            focusedIndex === globalIndex && 'ring-2 ring-ring ring-offset-2'
                          )}
                        >
                          {search.query}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-2">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Sıralama</p>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((option, index) => {
                    const globalIndex = hasRecentSearches ? recentSearches.slice(0, 5).length + index : index;
                    const isFocused = focusedIndex === globalIndex;
                    const isSelected = sortBy === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        onMouseEnter={() => setFocusedIndex(globalIndex)}
                        className={cn(
                          'w-full px-3 py-2 rounded-md text-sm text-left transition-colors flex items-center justify-between',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                          isFocused && !isSelected && 'bg-muted'
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && <ChevronDown className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
