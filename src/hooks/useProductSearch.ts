// Product Search Hook for Suppliers (Phase 9)

import { useState, useCallback, useEffect } from 'react';
import { useSupplierProducts } from '@/hooks/useSupplierProducts';
import type { ProductSearchFilters, ProductSortOption, RecentSearch } from '@/types/supplier';

const RECENT_SEARCHES_KEY = 'supplier-recent-searches';
const MAX_RECENT_SEARCHES = 10;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook: Product search with debouncing and filters
 */
export function useProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<ProductSearchFilters>({});
  const [sortBy, setSortBy] = useState<ProductSortOption>('modified_desc');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const searches: RecentSearch[] = JSON.parse(stored);
        // Filter out searches older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const valid = searches.filter(
          (s) => new Date(s.timestamp) > thirtyDaysAgo
        );
        setRecentSearches(valid);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products with current filters
  const { data, isLoading, error, refetch } = useSupplierProducts({
    filters: {
      ...filters,
      query: debouncedQuery || undefined,
    },
    sortBy,
  });

  /**
   * Update search query
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setFilters({});
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<ProductSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear specific filter
   */
  const clearFilter = useCallback((key: keyof ProductSearchFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Save search to recent searches
   */
  const saveSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: new Date().toISOString(),
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };

    setRecentSearches((prev) => {
      // Remove duplicate searches
      const filtered = prev.filter((s) => s.query !== newSearch.query);
      // Add new search to beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }

      return updated;
    });
  }, [filters]);

  /**
   * Load recent search
   */
  const loadRecentSearch = useCallback((search: RecentSearch) => {
    setSearchQuery(search.query);
    setFilters(search.filters || {});
  }, []);

  /**
   * Clear recent searches
   */
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  /**
   * Get active filter count
   */
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  return {
    // Search state
    searchQuery,
    debouncedQuery,
    setSearchQuery: handleSearchChange,
    clearSearch,

    // Results
    products: data?.products || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,

    // Filters
    filters,
    updateFilters,
    clearFilter,
    clearAllFilters,
    activeFilterCount: getActiveFilterCount(),

    // Sorting
    sortBy,
    setSortBy,

    // Recent searches
    recentSearches,
    saveSearch,
    loadRecentSearch,
    clearRecentSearches,

    // Pagination
    hasMore: data?.hasMore || false,
  };
}

/**
 * Hook: Product categories with count
 */
export function useProductCategories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from products
  const { data: categoriesData } = useSupplierProducts({
    filters: {}, // Get all products to extract categories
  });

  // Count products per category
  const categoryCounts = categoriesData?.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const categories = Object.keys(categoryCounts).sort();

  return {
    categories,
    categoryCounts,
    selectedCategory,
    setSelectedCategory,
  };
}

/**
 * Hook: Price range from products
 */
export function usePriceRange() {
  const { data: productsData } = useSupplierProducts({
    filters: {},
  });

  const products = productsData?.products || [];

  const minPrice = products.length > 0
    ? Math.min(...products.map((p) => p.base_price))
    : 0;
  const maxPrice = products.length > 0
    ? Math.max(...products.map((p) => p.base_price))
    : 100;

  return { minPrice, maxPrice };
}
