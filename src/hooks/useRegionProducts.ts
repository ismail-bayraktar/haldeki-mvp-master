import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegionProductInfo } from "@/types";

/**
 * Belirli bir bölgedeki tüm aktif ürün-bölge eşleşmelerini çeker
 */
export function useRegionProducts(regionId: string | null) {
  return useQuery({
    queryKey: ["region-products", regionId],
    queryFn: async () => {
      if (!regionId) return [];

      const { data, error } = await supabase
        .from("region_products")
        .select("*")
        .eq("region_id", regionId)
        .eq("is_active", true);

      if (error) throw error;
      return data as RegionProductInfo[];
    },
    enabled: !!regionId,
    staleTime: 2 * 60 * 1000, // 2 dakika cache
  });
}

/**
 * Tek bir ürün için belirli bir bölgedeki fiyat/stok bilgisini çeker
 */
export function useRegionProduct(regionId: string | null, productId: string | null) {
  return useQuery({
    queryKey: ["region-product", regionId, productId],
    queryFn: async () => {
      if (!regionId || !productId) return null;

      const { data, error } = await supabase
        .from("region_products")
        .select("*")
        .eq("region_id", regionId)
        .eq("product_id", productId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as RegionProductInfo | null;
    },
    enabled: !!regionId && !!productId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Bugün Halde ürünleri için bölge bazlı fiyat/stok bilgisini çeker
 * (is_bugun_halde flag'i products tablosunda, fiyat/stok region_products'ta)
 */
export function useBugunHaldeRegionProducts(regionId: string | null) {
  return useQuery({
    queryKey: ["bugun-halde-region-products", regionId],
    queryFn: async () => {
      if (!regionId) return [];

      const { data, error } = await supabase
        .from("region_products")
        .select(`
          *,
          products!inner (
            is_bugun_halde
          )
        `)
        .eq("region_id", regionId)
        .eq("is_active", true)
        .eq("products.is_bugun_halde", true);

      if (error) throw error;
      
      // products nested objesini kaldır, sadece region_products bilgisi döndür
      return data.map(item => ({
        id: item.id,
        region_id: item.region_id,
        product_id: item.product_id,
        price: item.price,
        previous_price: item.previous_price,
        price_change: item.price_change,
        availability: item.availability,
        stock_quantity: item.stock_quantity,
        is_active: item.is_active,
      })) as RegionProductInfo[];
    },
    enabled: !!regionId,
    staleTime: 2 * 60 * 1000,
  });
}
