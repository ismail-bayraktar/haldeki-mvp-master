/**
 * Product Variations Hooks Tests - Phase 12
 * Tests for product variations React Query hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useProductVariations,
  useProductVariationsGrouped,
  useVariationTypes,
  useAllVariations,
  useCreateProductVariation,
  useUpdateProductVariation,
  useDeleteProductVariation,
  useBulkCreateVariations,
} from '@/hooks/useProductVariations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useProductVariations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should fetch variations for a product', async () => {
    const mockVariations = [
      {
        variation_type: 'size',
        variation_value: '4 LT',
        display_order: 1,
        metadata: { value: '4', unit: 'LT' },
      },
      {
        variation_type: 'type',
        variation_value: 'BEYAZ',
        display_order: 2,
        metadata: null,
      },
    ];

    (supabase.rpc as any).mockResolvedValue({
      data: mockVariations,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariations('product-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVariations);
    expect(supabase.rpc).toHaveBeenCalledWith('get_product_variations', {
      p_product_id: 'product-123',
    });
  });

  it('should not fetch when productId is empty', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariations(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('should handle RPC errors', async () => {
    const mockError = new Error('RPC failed');
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariations('product-123'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should return empty array when no variations found', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [],
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariations('product-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useProductVariationsGrouped', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should group variations by type', async () => {
    const mockVariations = [
      { variation_type: 'size', variation_value: '4 LT', display_order: 1, metadata: null },
      { variation_type: 'size', variation_value: '5 LT', display_order: 1, metadata: null },
      { variation_type: 'type', variation_value: 'BEYAZ', display_order: 2, metadata: null },
      { variation_type: 'type', variation_value: 'RENKLI', display_order: 2, metadata: null },
      { variation_type: 'scent', variation_value: 'LAVANTA', display_order: 3, metadata: null },
    ];

    (supabase.rpc as any).mockResolvedValue({
      data: mockVariations,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariationsGrouped('product-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const grouped = result.current.data;
    expect(grouped?.size).toHaveLength(2);
    expect(grouped?.type).toHaveLength(2);
    expect(grouped?.scent).toHaveLength(1);
  });

  it('should return empty object when no variations', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [],
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useProductVariationsGrouped('product-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Object.keys(result.current.data || {})).toHaveLength(0);
  });
});

describe('useVariationTypes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should return all variation types', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useVariationTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      'size',
      'type',
      'scent',
      'packaging',
      'material',
      'flavor',
      'other',
    ]);
  });

  it('should cache variation types indefinitely', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useVariationTypes(), { wrapper });

    expect(result.current.staleTime).toBe(Infinity);
  });
});

describe('useAllVariations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should fetch all variations from database', async () => {
    const mockVariations = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        variation_type: 'size',
        variation_value: '4 LT',
        display_order: 1,
        metadata: null,
      },
      {
        id: 'var-2',
        product_id: 'prod-2',
        variation_type: 'type',
        variation_value: 'BEYAZ',
        display_order: 2,
        metadata: null,
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockVariations,
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useAllVariations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVariations);
    expect(supabase.from).toHaveBeenCalledWith('product_variations');
  });
});

describe('useCreateProductVariation', () => {
  let queryClient: QueryClient;
  const { toast } = require('sonner');

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should create variation successfully', async () => {
    const mockVariation = {
      id: 'var-1',
      product_id: 'prod-1',
      variation_type: 'size',
      variation_value: '4 LT',
      display_order: 1,
      metadata: { value: '4', unit: 'LT' },
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockVariation,
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useCreateProductVariation(), { wrapper });

    await result.current.mutateAsync({
      product_id: 'prod-1',
      variation_type: 'size',
      variation_value: '4 LT',
      display_order: 1,
      metadata: { value: '4', unit: 'LT' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Varyasyon eklendi');
  });

  it('should handle creation errors', async () => {
    const mockError = new Error('Creation failed');
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useCreateProductVariation(), { wrapper });

    await expect(
      result.current.mutateAsync({
        product_id: 'prod-1',
        variation_type: 'size',
        variation_value: '4 LT',
      })
    ).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledWith('Varyasyon eklenirken hata: Creation failed');
  });

  it('should invalidate related queries on success', async () => {
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    const mockVariation = {
      id: 'var-1',
      product_id: 'prod-1',
      variation_type: 'size',
      variation_value: '4 LT',
      display_order: 1,
      metadata: null,
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockVariation,
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useCreateProductVariation(), { wrapper });

    await result.current.mutateAsync({
      product_id: 'prod-1',
      variation_type: 'size',
      variation_value: '4 LT',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['product-variations', 'prod-1'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['product-variations-grouped', 'prod-1'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['all-variations'] });
  });
});

describe('useUpdateProductVariation', () => {
  let queryClient: QueryClient;
  const { toast } = require('sonner');

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should update variation successfully', async () => {
    const mockUpdatedVariation = {
      id: 'var-1',
      product_id: 'prod-1',
      variation_type: 'size',
      variation_value: '5 LT',
      display_order: 1,
      metadata: null,
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedVariation,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ update: mockUpdate });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useUpdateProductVariation(), { wrapper });

    await result.current.mutateAsync({
      variationId: 'var-1',
      updates: { variation_value: '5 LT' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Varyasyon güncellendi');
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ update: mockUpdate });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useUpdateProductVariation(), { wrapper });

    await expect(
      result.current.mutateAsync({
        variationId: 'var-1',
        updates: { variation_value: '5 LT' },
      })
    ).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledWith('Varyasyon güncellenirken hata: Update failed');
  });
});

describe('useDeleteProductVariation', () => {
  let queryClient: QueryClient;
  const { toast } = require('sonner');

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should delete variation successfully', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    });

    (supabase.from as any).mockReturnValue({ delete: mockDelete });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useDeleteProductVariation(), { wrapper });

    await result.current.mutateAsync('var-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Varyasyon silindi');
  });

  it('should handle deletion errors', async () => {
    const mockError = new Error('Delete failed');
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: mockError,
      }),
    });

    (supabase.from as any).mockReturnValue({ delete: mockDelete });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useDeleteProductVariation(), { wrapper });

    await expect(result.current.mutateAsync('var-1')).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith('Varyasyon silinirken hata: Delete failed');
  });
});

describe('useBulkCreateVariations', () => {
  let queryClient: QueryClient;
  const { toast } = require('sonner');

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should create multiple variations successfully', async () => {
    const mockVariations = [
      { variation_type: 'size' as const, variation_value: '4 LT', display_order: 1 },
      { variation_type: 'type' as const, variation_value: 'BEYAZ', display_order: 2 },
      { variation_type: 'scent' as const, variation_value: 'LAVANTA', display_order: 3 },
    ];

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { id: 'var-1', ...mockVariations[0] },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'var-2', ...mockVariations[1] },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'var-3', ...mockVariations[2] },
            error: null,
          }),
      }),
    });

    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useBulkCreateVariations(), { wrapper });

    await result.current.mutateAsync({
      productId: 'prod-1',
      variations: mockVariations,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('3 varyasyon eklendi');
  });

  it('should handle partial failures', async () => {
    const mockVariations = [
      { variation_type: 'size' as const, variation_value: '4 LT', display_order: 1 },
      { variation_type: 'type' as const, variation_value: 'BEYAZ', display_order: 2 },
      { variation_type: 'scent' as const, variation_value: 'LAVANTA', display_order: 3 },
    ];

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { id: 'var-1', ...mockVariations[0] },
            error: null,
          })
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce({
            data: { id: 'var-3', ...mockVariations[2] },
            error: null,
          }),
      }),
    });

    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useBulkCreateVariations(), { wrapper });

    await result.current.mutateAsync({
      productId: 'prod-1',
      variations: mockVariations,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.warning).toHaveBeenCalledWith('2 varyasyon eklendi, 1 başarısız');
  });
});
