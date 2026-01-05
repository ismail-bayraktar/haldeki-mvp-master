import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Table as TableIcon, Plus, Tag, Bell, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header, Footer, MobileNav } from "@/components/layout";
import { RegionBanner } from "@/components/region";
import { ProductCard, ProductCardSkeleton } from "@/components/product";
import { useBugunHaldeProducts, DbProduct } from "@/hooks/useProducts";
import { useRegionProducts } from "@/hooks/useRegionProducts";
import { useRegion } from "@/contexts/RegionContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { mergeProductsWithRegion, sortByAvailability, getPriceChangeLabel } from "@/lib/productUtils";
import { cn } from "@/lib/utils";
import { Product, ProductWithRegionInfo } from "@/types";
import { toast } from "sonner";

// Helper to convert DB product to frontend Product type
const convertDbProduct = (dbProduct: DbProduct): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  slug: dbProduct.slug,
  categoryId: dbProduct.category,
  categoryName: dbProduct.category,
  price: dbProduct.base_price,
  unit: dbProduct.unit,
  origin: dbProduct.origin || 'Türkiye',
  quality: dbProduct.quality || 'standart',
  arrivalDate: dbProduct.arrival_date || new Date().toISOString().split("T")[0],
  availability: dbProduct.availability || 'plenty',
  isBugunHalde: dbProduct.is_bugun_halde,
  priceChange: dbProduct.price_change || 'stable',
  previousPrice: dbProduct.previous_price ?? undefined,
  images: dbProduct.images || [],
  description: dbProduct.description ?? undefined,
});

const BugunHalde = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { selectedRegion } = useRegion();
  const { isBusiness } = useAuth();
  const { data: dbProducts, isLoading: isProductsLoading } = useBugunHaldeProducts();
  const { data: regionProducts, isLoading: isRegionLoading } = useRegionProducts(selectedRegion?.id ?? null);
  const { addToCart } = useCart();

  const isLoading = isProductsLoading || (selectedRegion && isRegionLoading);

  // Convert DB products to frontend type
  const products = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.map(convertDbProduct);
  }, [dbProducts]);

  // Merge with region info (client-side merge)
  const productsWithRegion: ProductWithRegionInfo[] = useMemo(() => {
    if (!products.length) return [];
    const merged = mergeProductsWithRegion(products, regionProducts ?? []);
    return sortByAvailability(merged);
  }, [products, regionProducts]);

  const handleAddToCart = (product: ProductWithRegionInfo) => {
    if (selectedRegion) {
      if (!product.regionInfo?.isInRegion) {
        toast.error("Bu ürün seçili bölgede satılmamaktadır");
        return;
      }
      if (product.regionInfo.stockQuantity === 0) {
        toast.error("Ürün stokta yok");
        return;
      }
    }
    
    // 2A.3: Add to cart with correct price based on role
    const price = (isBusiness && product.regionInfo?.businessPrice) 
      ? product.regionInfo.businessPrice 
      : (product.regionInfo?.price ?? product.price);
      
    addToCart(product, 1, undefined, price);
  };

  const handleNotifyStock = (productName: string) => {
    toast.success("Ürün stoğa girdiğinde size haber vereceğiz!", {
      description: productName,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8 md:py-12 bg-fresh-orange-light">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Tag className="h-8 w-8 text-primary" />
              {isBusiness ? "İşletme Özel Fiyatları" : "Bugün Halde"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isBusiness ? "İşletmenize özel avantajlı fiyatlar" : "Günün en taze ürünleri ve özel fiyatları"}
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            {/* Region Banner */}
            <RegionBanner className="mb-6" />

            <div className="flex justify-end mb-6">
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-none", viewMode === "grid" && "bg-secondary")}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kart
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-none", viewMode === "table" && "bg-secondary")}
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Tablo
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : productsWithRegion.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl font-medium text-foreground mb-2">Bugün halde ürün yok</p>
                <p className="text-muted-foreground">Yakında yeni ürünler eklenecek</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productsWithRegion.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    regionInfo={product.regionInfo}
                    variant="bugunHalde" 
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Ürün</TableHead>
                      <TableHead>Menşei</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsWithRegion.map((product) => {
                      const regularPrice = product.regionInfo?.price ?? product.price;
                      const businessPrice = product.regionInfo?.businessPrice;
                      const displayPrice = (isBusiness && businessPrice) ? businessPrice : regularPrice;
                      
                      const isInRegion = product.regionInfo?.isInRegion ?? false;
                      const isOutOfStock = product.regionInfo?.stockQuantity === 0;
                      const canAdd = !selectedRegion || (isInRegion && !isOutOfStock);
                      const priceLabel = product.regionInfo?.priceChange 
                        ? getPriceChangeLabel(product.regionInfo.priceChange)
                        : getPriceChangeLabel(product.priceChange);

                      return (
                        <TableRow 
                          key={product.id} 
                          className={cn(
                            "hover:bg-secondary/30",
                            selectedRegion && !isInRegion && "opacity-60"
                          )}
                        >
                          <TableCell>
                            <Link to={`/urun/${product.slug}`} className="flex items-center gap-3 hover:text-primary">
                              <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                              <div>
                                <span className="font-medium block">{product.name}</span>
                                {priceLabel && (
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full",
                                    product.regionInfo?.priceChange === "down" || product.priceChange === "down"
                                      ? "bg-fresh-down/10 text-fresh-down"
                                      : "bg-fresh-up/10 text-fresh-up"
                                  )}>
                                    {priceLabel}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{product.origin}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <span className={cn("font-bold", isBusiness && businessPrice && "text-primary")}>
                                  {displayPrice.toFixed(2)}₺
                                </span>
                                <span className="text-muted-foreground text-xs">/{product.unit}</span>
                              </div>
                              {isBusiness && businessPrice && regularPrice > businessPrice && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {regularPrice.toFixed(2)}₺
                                </span>
                              )}
                              {!isBusiness && product.regionInfo?.previousPrice && product.regionInfo.previousPrice > displayPrice && (
                                <span className="block text-[10px] text-muted-foreground line-through">
                                  {product.regionInfo.previousPrice.toFixed(2)}₺
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {selectedRegion && !isInRegion ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                <Ban className="h-3 w-3" />
                                Yok
                              </span>
                            ) : isOutOfStock ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-stock-last/10 text-stock-last">
                                Tükendi
                              </span>
                            ) : (
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                product.regionInfo?.availability === "plenty" || product.availability === "plenty" 
                                  ? "bg-stock-plenty/10 text-stock-plenty" 
                                  : product.regionInfo?.availability === "limited" || product.availability === "limited"
                                  ? "bg-stock-limited/10 text-stock-limited"
                                  : "bg-stock-last/10 text-stock-last"
                              )}>
                                {product.regionInfo?.availability === "plenty" || product.availability === "plenty" 
                                  ? "Bol" 
                                  : product.regionInfo?.availability === "limited" || product.availability === "limited"
                                  ? "Sınırlı" 
                                  : "Son"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.regionInfo && product.regionInfo.stockQuantity > 0 ? (
                              <span className="text-sm text-muted-foreground">
                                {product.regionInfo.stockQuantity} {product.unit}
                              </span>
                            ) : selectedRegion && isInRegion && isOutOfStock ? (
                              <span className="text-xs text-stock-last">—</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isOutOfStock && isInRegion ? (
                              <Button 
                                size="icon" 
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleNotifyStock(product.name)}
                                title="Gelince haber ver"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                className={cn(
                                  "h-8 w-8 rounded-full",
                                  !canAdd && "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                                onClick={() => handleAddToCart(product)}
                                disabled={!canAdd && !!selectedRegion}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default BugunHalde;
