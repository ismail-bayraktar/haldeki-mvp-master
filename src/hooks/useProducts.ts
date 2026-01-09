import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type DbProduct = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

/**
 * Phase 12: Get Bugün Halde products from supplier_products
 * Returns products with their lowest supplier price as base_price
 */
export function useBugunHaldeProducts() {
  return useQuery({
    queryKey: ["products", "bugunHalde"],
    queryFn: async () => {
      // Phase 12: Fetch from supplier_products junction table
      const { data, error } = await supabase
        .from("supplier_products")
        .select(`
          product_id,
          price,
          products (
            id,
            name,
            slug,
            category,
            unit,
            images,
            description,
            origin,
            quality,
            arrival_date,
            availability,
            is_bugun_halde,
            is_active,
            price_change,
            previous_price,
            product_status,
            created_at,
            updated_at
          )
        `)
        .eq("is_active", true)
        .eq("products.is_active", true)
        .eq("products.is_bugun_halde", true);

      if (error) throw error;

      // Group by product and find lowest price
      const productMap = new Map<string, DbProduct & { supplier_price: number }>();

      for (const sp of data || []) {
        const product = sp.products;
        if (!product) continue;

        const existing = productMap.get(product.id);
        const price = typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price;

        // Keep the entry with lowest price
        if (!existing || price < existing.supplier_price) {
          productMap.set(product.id, {
            ...product,
            base_price: price, // Populate base_price with lowest supplier price
            supplier_price: price,
          } as DbProduct & { supplier_price: number });
        }
      }

      // Convert to array and sort by name
      const products = Array.from(productMap.values())
        .map(({ supplier_price, ...product }) => product);

      return products as DbProduct[];
    },
  });
}

/**
 * Phase 12: Get product by slug with lowest supplier price
 * Returns product with base_price populated from supplier_products
 */
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["products", "slug", slug],
    queryFn: async () => {
      // Phase 12: Fetch product with lowest supplier price
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          category,
          unit,
          images,
          description,
          origin,
          quality,
          arrival_date,
          availability,
          is_bugun_halde,
          is_active,
          price_change,
          previous_price,
          product_status,
          created_at,
          updated_at
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Get lowest price from supplier_products
      const { data: supplierPrice, error: priceError } = await supabase
        .from("supplier_products")
        .select("price")
        .eq("product_id", data.id)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (priceError && priceError.code !== 'PGRST116') {
        // PGRST116 = row not found, which is ok
        throw priceError;
      }

      // Populate base_price with lowest supplier price
      const product: DbProduct = {
        ...data,
        base_price: supplierPrice
          ? (typeof supplierPrice.price === 'string' ? parseFloat(supplierPrice.price) : supplierPrice.price)
          : 0, // Fallback if no supplier price exists
      };

      return product;
    },
    enabled: !!slug,
  });
}

/**
 * Phase 12: Get products by category with lowest supplier prices
 * Returns products with base_price populated from supplier_products
 */
export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: async () => {
      // Phase 12: Fetch from supplier_products junction table
      const { data, error } = await supabase
        .from("supplier_products")
        .select(`
          product_id,
          price,
          products (
            id,
            name,
            slug,
            category,
            unit,
            images,
            description,
            origin,
            quality,
            arrival_date,
            availability,
            is_bugun_halde,
            is_active,
            price_change,
            previous_price,
            product_status,
            created_at,
            updated_at
          )
        `)
        .eq("is_active", true)
        .eq("products.is_active", true)
        .eq("products.category", categoryId);

      if (error) throw error;

      // Group by product and find lowest price
      const productMap = new Map<string, DbProduct & { supplier_price: number }>();

      for (const sp of data || []) {
        const product = sp.products;
        if (!product) continue;

        const existing = productMap.get(product.id);
        const price = typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price;

        // Keep the entry with lowest price
        if (!existing || price < existing.supplier_price) {
          productMap.set(product.id, {
            ...product,
            base_price: price, // Populate base_price with lowest supplier price
            supplier_price: price,
          } as DbProduct & { supplier_price: number });
        }
      }

      // Convert to array and sort by name
      const products = Array.from(productMap.values())
        .map(({ supplier_price, ...product }) => product)
        .sort((a, b) => a.name.localeCompare(b.name));

      return products as DbProduct[];
    },
    enabled: !!categoryId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün başarıyla eklendi");
    },
    onError: (error) => {
      toast.error("Ürün eklenirken hata oluştu: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error("Ürün güncellenirken hata oluştu: " + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün başarıyla silindi");
    },
    onError: (error) => {
      toast.error("Ürün silinirken hata oluştu: " + error.message);
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(variables.isActive ? "Ürün aktifleştirildi" : "Ürün pasifleştirildi");
    },
    onError: (error) => {
      toast.error("İşlem sırasında hata oluştu: " + error.message);
    },
  });
}
