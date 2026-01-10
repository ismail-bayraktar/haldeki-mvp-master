/**
 * useSupplierCatalog Hook
 *
 * Optimized tedarikçi ürün katalog sorguları için React hook
 */

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  SupplierProductCatalogParams,
  SupplierProductCatalogResult,
  UpsertSupplierProductParams,
  UpsertSupplierProductResult,
  SupplierProductStatsResult,
  BatchUpsertSupplierPricesResult,
  transformCatalogItem,
  extractPaginationMeta,
  formToRpcParams,
  CatalogProduct,
  PaginatedCatalogResponse,
  SupplierProductFormInput,
} from '@/types/supplier-catalog.types'

// ============================================================================
// Query Keys
// ============================================================================

export const supplierCatalogKeys = {
  all: ['supplier-catalog'] as const,
  catalog: (supplierId: string) =>
    [...supplierCatalogKeys.all, 'catalog', supplierId] as const,
  paginated: (supplierId: string, params: Omit<SupplierProductCatalogParams, 'p_supplier_id'>) =>
    [...supplierCatalogKeys.catalog(supplierId), 'paginated', params] as const,
  stats: (supplierId: string) =>
    [...supplierCatalogKeys.all, 'stats', supplierId] as const,
}

// ============================================================================
// useSupplierCatalog - Main Hook
// ============================================================================

export interface UseSupplierCatalogOptions
  extends Omit<SupplierProductCatalogParams, 'p_supplier_id'> {
  enabled?: boolean
}

export interface UseSupplierCatalogResult {
  items: CatalogProduct[]
  meta: ReturnType<typeof extractPaginationMeta>
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useSupplierCatalog(
  supplierId: string | null,
  options: UseSupplierCatalogOptions = {}
): UseSupplierCatalogResult {
  const supabase = useSupabaseClient()
  const { p_page = 1, p_page_size = 50, p_category = null, p_search = null, p_only_active = true, enabled = true } = options

  const query = useQuery({
    queryKey: supplierCatalogKeys.paginated(supplierId ?? '', {
      p_page,
      p_page_size,
      p_category,
      p_search,
      p_only_active,
    }),
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID required')

      const { data, error } = await supabase.rpc(
        'get_supplier_product_catalog',
        {
          p_supplier_id: supplierId,
          p_page,
          p_page_size: p_page_size,
          p_category,
          p_search,
          p_only_active,
        }
      )

      if (error) throw error
      return data as SupplierProductCatalogResult
    },
    enabled: enabled && !!supplierId,
    staleTime: 30_000, // 30 seconds
  })

  const items = (query.data ?? []).map(transformCatalogItem)
  const meta = extractPaginationMeta(query.data ?? [])

  return {
    items,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

// ============================================================================
// useSupplierProductStats
// ============================================================================

export function useSupplierProductStats(supplierId: string | null) {
  const supabase = useSupabaseClient()

  return useQuery({
    queryKey: supplierCatalogKeys.stats(supplierId ?? ''),
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID required')

      const { data, error } = await supabase.rpc('get_supplier_product_stats', {
        p_supplier_id: supplierId,
      })

      if (error) throw error
      return data as SupplierProductStatsResult
    },
    enabled: !!supplierId,
    staleTime: 60_000, // 1 minute
  })
}

// ============================================================================
// useUpsertSupplierProduct
// ============================================================================

export interface UpsertMutationOptions {
  onSuccess?: (result: UpsertSupplierProductResult) => void
  onError?: (error: Error) => void
}

export function useUpsertSupplierProduct(
  supplierId: string | null,
  options: UpsertMutationOptions = {}
) {
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (params: UpsertSupplierProductParams | { form: SupplierProductFormInput }) => {
      if (!supplierId) throw new Error('Supplier ID required')

      // Form input ise RPC params'a çevir
      const rpcParams = 'form' in params
        ? formToRpcParams(supplierId, params.form)
        : params

      const { data, error } = await supabase.rpc(
        'upsert_supplier_product_price',
        rpcParams
      )

      if (error) throw error
      return data as UpsertSupplierProductResult
    },
    onSuccess: (result) => {
      // Invalidate catalog queries
      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: supplierCatalogKeys.catalog(supplierId) })
      }
      options.onSuccess?.(result)
    },
    onError: options.onError,
  })

  return {
    upsert: mutation.mutate,
    upsertAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}

// ============================================================================
// useBatchUpsertSupplierPrices
// ============================================================================

export interface BatchUpsertMutationOptions {
  onSuccess?: (results: BatchUpsertSupplierPricesResult) => void
  onError?: (error: Error) => void
}

export function useBatchUpsertSupplierPrices(
  supplierId: string | null,
  options: BatchUpsertMutationOptions = {}
) {
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (products: Array<{
      product_id: string
      price: number
      stock_quantity?: number
      availability?: string
      min_order_quantity?: number
      delivery_days?: number
      supplier_sku?: string
      quality?: string
    }>) => {
      if (!supplierId) throw new Error('Supplier ID required')

      const { data, error } = await supabase.rpc(
        'batch_upsert_supplier_prices',
        {
          p_supplier_id: supplierId,
          p_products: JSON.stringify(products),
        }
      )

      if (error) throw error
      return data as BatchUpsertSupplierPricesResult
    },
    onSuccess: (result) => {
      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: supplierCatalogKeys.catalog(supplierId) })
        queryClient.invalidateQueries({ queryKey: supplierCatalogKeys.stats(supplierId) })
      }
      options.onSuccess?.(result)
    },
    onError: options.onError,
  })

  return {
    batchUpsert: mutation.mutate,
    batchUpsertAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}

// ============================================================================
// Helper Hook - useSupplierCatalogWithStats
// ============================================================================

export function useSupplierCatalogWithStats(
  supplierId: string | null,
  catalogOptions?: UseSupplierCatalogOptions
) {
  const catalog = useSupplierCatalog(supplierId, catalogOptions)
  const stats = useSupplierProductStats(supplierId)

  // Stats'ı object formatına çevir
  const statsMap = stats.data?.reduce((acc, stat) => {
    acc[stat.stat_name] = stat.stat_value
    return acc
  }, {} as Record<string, number>) ?? {}

  return {
    catalog,
    stats: {
      totalProducts: statsMap.total_products ?? 0,
      inStock: statsMap.in_stock ?? 0,
      outOfStock: statsMap.out_of_stock ?? 0,
      priceIncreased: statsMap.price_increased ?? 0,
      priceDecreased: statsMap.price_decreased ?? 0,
      isLoading: stats.isLoading,
      isError: stats.isError,
    },
    isLoading: catalog.isLoading || stats.isLoading,
    isError: catalog.isError || stats.isError,
    refetch: () => {
      catalog.refetch()
      stats.refetch()
    },
  }
}
