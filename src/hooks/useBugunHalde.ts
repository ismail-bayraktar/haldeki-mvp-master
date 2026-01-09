// Bugün Halde Comparison Hooks (Phase 12)

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  BugunHaldeComparisonRow,
  BugunHaldeFilters,
  SupplierCatalogItem,
} from '@/types/multiSupplier';

/**
 * Hook: Get Bugün Halde comparison view with filters
 */
export function useBugunHaldeComparison(filters?: BugunHaldeFilters) {
  return useQuery({
    queryKey: ['bugun-halde', filters],
    queryFn: async (): Promise<BugunHaldeComparisonRow[]> => {
      let query = supabase
        .from('bugun_halde_comparison')
        .select('*');

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters?.quality) {
        query = query.eq('quality', filters.quality);
      }

      if (filters?.onlyLowestPrice) {
        query = query.eq('is_lowest_price', true);
      }

      if (filters?.onlyFeatured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.minSuppliers !== undefined) {
        query = query.gte('total_suppliers', filters.minSuppliers);
      }

      if (filters?.searchQuery) {
        query = query.ilike('product_name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query.order('product_name').order('price');

      if (error) throw error;
      return (data || []) as BugunHaldeComparisonRow[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get Bugün Halde comparison grouped by product
 */
export function useBugunHaldeComparisonGrouped(filters?: BugunHaldeFilters) {
  return useQuery({
    queryKey: ['bugun-halde-grouped', filters],
    queryFn: async () => {
      let query = supabase
        .from('bugun_halde_comparison')
        .select('*');

      // Apply same filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters?.quality) {
        query = query.eq('quality', filters.quality);
      }

      if (filters?.searchQuery) {
        query = query.ilike('product_name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query.order('product_name').order('price');

      if (error) throw error;

      // Group by product
      const grouped = new Map<string, BugunHaldeComparisonRow[]>();
      for (const row of (data || []) as BugunHaldeComparisonRow[]) {
        if (!grouped.has(row.product_id)) {
          grouped.set(row.product_id, []);
        }
        grouped.get(row.product_id)!.push(row);
      }

      // Convert to array and filter by minSuppliers
      let result = Array.from(grouped.values());

      if (filters?.minSuppliers !== undefined) {
        result = result.filter((suppliers) => suppliers.length >= filters.minSuppliers!);
      }

      if (filters?.onlyLowestPrice) {
        result = result.map((suppliers) => suppliers.filter((s) => s.is_lowest_price));
      }

      if (filters?.onlyFeatured) {
        result = result.map((suppliers) => suppliers.filter((s) => s.is_featured));
      }

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get products with multiple suppliers (for comparison)
 */
export function useMultiSupplierProducts(filters?: BugunHaldeFilters) {
  const minSuppliers = filters?.minSuppliers ?? 2;

  return useQuery({
    queryKey: ['multi-supplier-products', minSuppliers, filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', minSuppliers);

      if (error) throw error;

      // Group by product and filter
      const grouped = new Map<string, BugunHaldeComparisonRow[]>();
      for (const row of (data || []) as BugunHaldeComparisonRow[]) {
        if (!grouped.has(row.product_id)) {
          grouped.set(row.product_id, []);
        }
        grouped.get(row.product_id)!.push(row);
      }

      // Apply additional filters
      let result = Array.from(grouped.values());

      if (filters?.category) {
        result = result.filter((suppliers) =>
          suppliers[0].category === filters.category
        );
      }

      if (filters?.searchQuery) {
        result = result.filter((suppliers) =>
          suppliers[0].product_name.toLowerCase().includes(filters.searchQuery!.toLowerCase())
        );
      }

      if (filters?.onlyLowestPrice) {
        result = result.map((suppliers) => suppliers.filter((s) => s.is_lowest_price));
      }

      if (filters?.onlyFeatured) {
        result = result.map((suppliers) => suppliers.filter((s) => s.is_featured));
      }

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get supplier catalog with variations
 */
export function useSupplierCatalog(supplierId?: string) {
  return useQuery({
    queryKey: ['supplier-catalog', supplierId],
    queryFn: async (): Promise<SupplierCatalogItem[]> => {
      let query = supabase
        .from('supplier_catalog_with_variations')
        .select('*');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query.order('supplier_name').order('product_name');

      if (error) throw error;
      return (data || []) as SupplierCatalogItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Get available categories for Bugün Halde filters
 */
export function useBugunHaldeCategories() {
  return useQuery<string[]>({
    queryKey: ['bugun-halde-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('category');

      if (error) throw error;

      const categories = Array.from(
        new Set((data || []).map((row) => row.category))
      ).sort();

      return categories;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Get price range for Bugün Halde filters
 */
export function useBugunHaldePriceRange() {
  return useQuery<{ min: number; max: number }>({
    queryKey: ['bugun-halde-price-range'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('price')
        .order('price', { ascending: true })
        .limit(1);

      if (error) throw error;

      const { data: maxData, error: maxError } = await supabase
        .from('bugun_halde_comparison')
        .select('price')
        .order('price', { ascending: false })
        .limit(1);

      if (maxError) throw maxError;

      return {
        min: data?.[0]?.price || 0,
        max: maxData?.[0]?.price || 1000,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Get best deals (lowest prices across suppliers)
 */
export function useBugunHaldeBestDeals(limit: number = 20) {
  return useQuery({
    queryKey: ['bugun-halde-best-deals', limit],
    queryFn: async (): Promise<BugunHaldeComparisonRow[]> => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('is_lowest_price', true)
        .order('price', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as BugunHaldeComparisonRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Get featured products across suppliers
 */
export function useBugunHaldeFeatured() {
  return useQuery({
    queryKey: ['bugun-halde-featured'],
    queryFn: async (): Promise<BugunHaldeComparisonRow[]> => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('is_featured', true)
        .order('product_name');

      if (error) throw error;
      return (data || []) as BugunHaldeComparisonRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Get products with price drops
 */
export function useBugunHaldePriceDrops() {
  return useQuery({
    queryKey: ['bugun-halde-price-drops'],
    queryFn: async (): Promise<BugunHaldeComparisonRow[]> => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('price_change', 'decreased')
        .order('product_name');

      if (error) throw error;
      return (data || []) as BugunHaldeComparisonRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
