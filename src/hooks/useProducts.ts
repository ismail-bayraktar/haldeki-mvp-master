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

export function useBugunHaldeProducts() {
  return useQuery({
    queryKey: ["products", "bugunHalde"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_bugun_halde", true)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["products", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as DbProduct | null;
    },
    enabled: !!slug,
  });
}

export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", categoryId)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as DbProduct[];
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
