import { supabase } from "@/integrations/supabase/client";
import { CartItem, CartValidationResult, RegionProductInfo } from "@/types";

/**
 * Sepetteki ürünleri yeni bölge için validate eder.
 * Tek sorgu ile tüm ürünleri kontrol eder (N+1 yok).
 */
export async function validateCartForRegion(
  items: CartItem[],
  newRegionId: string
): Promise<CartValidationResult> {
  if (items.length === 0) {
    return { invalidItems: [], repriceItems: [], hasChanges: false };
  }

  const productIds = items.map((item) => item.productId);

  // Tek sorgu ile yeni bölgedeki tüm ürün bilgilerini al
  const { data: regionProducts, error } = await supabase
    .from("region_products")
    .select("product_id, price, stock_quantity, is_active, availability")
    .eq("region_id", newRegionId)
    .in("product_id", productIds);

  if (error) {
    console.error("Cart validation error:", error);
    throw error;
  }

  // Map oluştur: product_id -> region product info
  const regionProductMap = new Map<string, RegionProductInfo>();
  (regionProducts || []).forEach((rp) => {
    regionProductMap.set(rp.product_id, rp as unknown as RegionProductInfo);
  });

  const invalidItems: CartValidationResult["invalidItems"] = [];
  const repriceItems: CartValidationResult["repriceItems"] = [];

  for (const item of items) {
    const regionProduct = regionProductMap.get(item.productId);

    if (!regionProduct) {
      // Ürün bu bölgede yok
      invalidItems.push({
        productId: item.productId,
        productName: item.product.name,
        reason: "not_in_region",
      });
      continue;
    }

    if (regionProduct.stock_quantity === 0 || !regionProduct.is_active) {
      // Stok tükendi veya pasif
      invalidItems.push({
        productId: item.productId,
        productName: item.product.name,
        reason: "out_of_stock",
      });
      continue;
    }

    // Fiyat değişimi kontrolü (unitPriceAtAdd vs yeni bölge fiyatı)
    if (regionProduct.price !== item.unitPriceAtAdd) {
      repriceItems.push({
        productId: item.productId,
        productName: item.product.name,
        oldPrice: item.unitPriceAtAdd,
        newPrice: regionProduct.price,
      });
    }
  }

  return {
    invalidItems,
    repriceItems,
    hasChanges: invalidItems.length > 0 || repriceItems.length > 0,
  };
}

/**
 * Validation sonucuna göre sepeti günceller.
 * invalidItems'ları çıkarır, repriceItems'ların fiyatını günceller.
 */
export function applyCartRegionChange(
  items: CartItem[],
  newRegionId: string,
  validationResult: CartValidationResult
): CartItem[] {
  const invalidProductIds = new Set(
    validationResult.invalidItems.map((i) => i.productId)
  );
  
  const repriceMap = new Map(
    validationResult.repriceItems.map((i) => [i.productId, i.newPrice])
  );

  // Invalid olanları çıkar, kalanları güncelle
  return items
    .filter((item) => !invalidProductIds.has(item.productId))
    .map((item) => ({
      ...item,
      unitPriceAtAdd: repriceMap.get(item.productId) ?? item.unitPriceAtAdd,
      regionIdAtAdd: newRegionId,
    }));
}
