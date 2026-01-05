import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegionProductInfo } from "@/types";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

// Bölgedeki tüm ürünleri getir (admin için)
export function useAdminRegionProducts(regionId: string | null) {
  return useQuery({
    queryKey: ["admin-region-products", regionId],
    queryFn: async () => {
      if (!regionId) return [];

      // 1. Bölge ürünlerini al
      const { data: regionProducts, error: rpError } = await supabase
        .from("region_products")
        .select("*")
        .eq("region_id", regionId)
        .order("created_at", { ascending: false });

      if (rpError) throw rpError;
      if (!regionProducts || regionProducts.length === 0) return [];

      // 2. Ürün detaylarını al
      const productIds = regionProducts.map((rp) => rp.product_id);
      const { data: products, error: pError } = await supabase
        .from("products")
        .select("id, name, slug, category, unit, images")
        .in("id", productIds);

      if (pError) throw pError;

      // 3. Birleştir
      const productMap = new Map((products || []).map((p) => [p.id, p]));
      return regionProducts.map((rp) => ({
        ...rp,
        products: productMap.get(rp.product_id) || null,
      }));
    },
    enabled: !!regionId,
  });
}

// Bölgede olmayan ürünleri getir (eklemek için)
export function useProductsNotInRegion(regionId: string | null) {
  return useQuery({
    queryKey: ["products-not-in-region", regionId],
    queryFn: async () => {
      if (!regionId) return [];

      // Önce bölgedeki ürün ID'lerini al
      const { data: regionProducts } = await supabase
        .from("region_products")
        .select("product_id")
        .eq("region_id", regionId);

      const existingProductIds = regionProducts?.map((rp) => rp.product_id) || [];

      // Bölgede olmayan ürünleri al
      let query = supabase
        .from("products")
        .select("id, name, slug, category, unit, base_price, images")
        .eq("is_active", true)
        .order("name");

      if (existingProductIds.length > 0) {
        query = query.not("id", "in", `(${existingProductIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!regionId,
  });
}

// Yeni ürün-bölge eşleşmesi ekle
export function useCreateRegionProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      region_id: string;
      product_id: string;
      price: number;
      business_price?: number | null;
      stock_quantity: number;
      availability: "plenty" | "limited" | "last";
      is_active: boolean;
    }) => {
      const { error } = await supabase.from("region_products").insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-region-products", variables.region_id] });
      queryClient.invalidateQueries({ queryKey: ["products-not-in-region", variables.region_id] });
      toast.success("Ürün bölgeye eklendi");
    },
    onError: (error) => {
      console.error("Create region product error:", error);
      toast.error("Ürün eklenirken hata oluştu");
    },
  });
}

// Ürün-bölge eşleşmesini güncelle
export function useUpdateRegionProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      regionId,
      ...data
    }: {
      id: string;
      regionId: string;
      price?: number;
      business_price?: number | null;
      previous_price?: number | null;
      price_change?: "up" | "down" | "stable";
      stock_quantity?: number;
      availability?: "plenty" | "limited" | "last";
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from("region_products")
        .update(data)
        .eq("id", id);
      if (error) throw error;
      return regionId;
    },
    onSuccess: (regionId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-region-products", regionId] });
      toast.success("Ürün güncellendi");
    },
    onError: (error) => {
      console.error("Update region product error:", error);
      toast.error("Güncellenirken hata oluştu");
    },
  });
}

// Ürün-bölge eşleşmesini sil
export function useDeleteRegionProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, regionId }: { id: string; regionId: string }) => {
      const { error } = await supabase.from("region_products").delete().eq("id", id);
      if (error) throw error;
      return regionId;
    },
    onSuccess: (regionId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-region-products", regionId] });
      queryClient.invalidateQueries({ queryKey: ["products-not-in-region", regionId] });
      toast.success("Ürün bölgeden kaldırıldı");
    },
    onError: (error) => {
      console.error("Delete region product error:", error);
      toast.error("Silinirken hata oluştu");
    },
  });
}

// Bölgede olmayan tüm aktif ürünleri toplu ekle
export function useBulkAddMissingProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regionId: string) => {
      // 1. Bölgedeki mevcut ürün ID'lerini al
      const { data: existingProducts } = await supabase
        .from("region_products")
        .select("product_id")
        .eq("region_id", regionId);

      const existingProductIds = new Set(
        existingProducts?.map((rp) => rp.product_id) || []
      );

      // 2. Tüm aktif ürünleri al
      const { data: allProducts, error: productsError } = await supabase
        .from("products")
        .select("id, base_price")
        .eq("is_active", true);

      if (productsError) throw productsError;

      // 3. Eksik ürünleri bul
      const missingProducts = (allProducts || []).filter(
        (p) => !existingProductIds.has(p.id)
      );

      if (missingProducts.length === 0) {
        return { added: 0 };
      }

      // 4. Batch insert
      const insertData: Database["public"]["Tables"]["region_products"]["Insert"][] = 
        missingProducts.map((product) => ({
          region_id: regionId,
          product_id: product.id,
          price: product.base_price || 0,
          stock_quantity: 100,
          availability: "plenty" as const,
          is_active: true,
        }));

      const { error: insertError } = await supabase
        .from("region_products")
        .insert(insertData);

      if (insertError) throw insertError;

      return { added: missingProducts.length };
    },
    onSuccess: (result, regionId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-region-products", regionId] });
      queryClient.invalidateQueries({ queryKey: ["products-not-in-region", regionId] });
      if (result.added > 0) {
        toast.success(`${result.added} eksik ürün bölgeye eklendi`);
      } else {
        toast.info("Tüm ürünler zaten bu bölgede");
      }
    },
    onError: (error) => {
      console.error("Bulk add missing products error:", error);
      toast.error("Toplu ekleme sırasında hata oluştu");
    },
  });
}
