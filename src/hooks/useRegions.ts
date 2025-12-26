import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbRegion, DeliverySlot } from "@/types";

/**
 * DB'den aktif bölgeleri çeken hook
 * - Sadece is_active = true olanları getirir
 * - sort_order'a göre sıralar (yoksa name'e göre)
 * - React Query ile cache yönetimi
 */
export function useRegions() {
  return useQuery({
    queryKey: ["regions", "active"],
    queryFn: async (): Promise<DbRegion[]> => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching regions:", error);
        throw error;
      }

      // delivery_slots JSON'ını parse et
      return (data || []).map((region) => ({
        ...region,
        delivery_slots: region.delivery_slots as unknown as DeliverySlot[] | null,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 30 * 60 * 1000, // 30 dakika (eski cacheTime)
  });
}

/**
 * Tek bir bölgeyi ID ile çeken hook
 */
export function useRegionById(regionId: string | null) {
  return useQuery({
    queryKey: ["regions", "byId", regionId],
    queryFn: async (): Promise<DbRegion | null> => {
      if (!regionId) return null;

      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("id", regionId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching region:", error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        delivery_slots: data.delivery_slots as unknown as DeliverySlot[] | null,
      };
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
  });
}
