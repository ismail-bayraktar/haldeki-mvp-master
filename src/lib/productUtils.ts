import { Product, ProductWithRegionInfo, RegionProductInfo, RegionPriceInfo } from "@/types";

/**
 * Master products listesi ile region_products verisini birleştirir (client-side merge)
 *
 * Bu strateji sayesinde:
 * - Her iki veriyi ayrı ayrı cache'leyebiliriz
 * - Bölge değiştiğinde sadece region_products yeniden çekilir
 * - "Bu bölgede yok" durumunu kolayca işaretleyebiliriz
 *
 * FALLBACK STRATEJİSİ:
 * - Eğer region_products'ta kayıt yoksa, ürünün base_price'ını kullan
 * - Bu sayede veritabanı değişikliği yapılmadan ürünler görüntülenir
 * - isInRegion: false olarak işaretlenir (fiyat fallback'dir)
 */
export function mergeProductsWithRegion(
  products: Product[],
  regionProducts: RegionProductInfo[]
): ProductWithRegionInfo[] {
  // Region products'u product_id'ye göre map'e çevir (O(1) lookup)
  const regionMap = new Map(regionProducts.map((rp) => [rp.product_id, rp]));

  return products.map((product) => {
    const regionRow = regionMap.get(product.id);

    return {
      ...product,
      regionInfo: regionRow
        ? {
            price: regionRow.price,
            businessPrice: regionRow.business_price,
            previousPrice: regionRow.previous_price,
            priceChange: regionRow.price_change,
            availability: regionRow.availability,
            stockQuantity: regionRow.stock_quantity,
            isAvailable: regionRow.stock_quantity > 0 && regionRow.is_active,
            isInRegion: true,
          }
        : {
            // FALLBACK: Ürünün base fiyatını kullan
            // Region products kaydı olmadığında ürün yine de görünür
            price: product.price,
            businessPrice: null,
            previousPrice: product.previousPrice,
            priceChange: product.priceChange,
            availability: product.availability,
            stockQuantity: 999, // Büyük bir değer - bölgesiz varsayılan
            isAvailable: true,
            isInRegion: false, // Bölge kaydı yok, fallback fiyat
          },
    };
  });
}

/**
 * Ürünleri stok durumuna göre sıralar:
 * 1. Bölge kaydı olan ürünler (önce) - isInRegion: true
 * 2. Fallback fiyatlı ürünler (sonra) - isInRegion: false
 * 3. Her iki grupta da stok durumuna göre sıralama
 */
export function sortByAvailability(
  products: ProductWithRegionInfo[]
): ProductWithRegionInfo[] {
  return [...products].sort((a, b) => {
    // Bölgede olmayanlar (fallback) en sona
    if (!a.regionInfo?.isInRegion && b.regionInfo?.isInRegion) return 1;
    if (a.regionInfo?.isInRegion && !b.regionInfo?.isInRegion) return -1;
    if (!a.regionInfo?.isInRegion && !b.regionInfo?.isInRegion) return 0;

    // Her ikisi de bölgede varsa, stok durumuna göre
    const aStock = a.regionInfo?.stockQuantity ?? 0;
    const bStock = b.regionInfo?.stockQuantity ?? 0;

    // Stok 0 olanlar alta
    if (aStock === 0 && bStock > 0) return 1;
    if (aStock > 0 && bStock === 0) return -1;

    return 0;
  });
}

/**
 * Tek bir ürün için RegionPriceInfo oluşturur
 */
export function getRegionPriceInfo(
  regionProduct: RegionProductInfo | null
): RegionPriceInfo | null {
  if (!regionProduct) return null;

  return {
    price: regionProduct.price,
    businessPrice: regionProduct.business_price,
    previousPrice: regionProduct.previous_price,
    priceChange: regionProduct.price_change,
    availability: regionProduct.availability,
    stockQuantity: regionProduct.stock_quantity,
    isAvailable: regionProduct.stock_quantity > 0 && regionProduct.is_active,
    isInRegion: true,
  };
}

/**
 * Fiyat değişim etiketini kampanya diline çevirir (finans terminolojisi yok)
 */
export function getPriceChangeLabel(priceChange: string): string | null {
  switch (priceChange) {
    case "down":
      return "Bugüne Özel";
    case "up":
      return "Yeni Hasat";
    default:
      return null;
  }
}

/**
 * Stok durumunu kullanıcı dostu metne çevirir
 */
export function getStockLabel(stockQuantity: number, unit: string): string {
  if (stockQuantity === 0) return "Tükendi";
  if (stockQuantity <= 10) return `Son ${stockQuantity} ${unit}`;
  return `Stok: ${stockQuantity} ${unit}`;
}
