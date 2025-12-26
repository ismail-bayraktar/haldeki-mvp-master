import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Plus, Minus, MapPin, Truck, Shield, Check, Heart, 
  Leaf, Award, Package, Clock, RefreshCw, Info, Bell, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header, Footer, MobileNav } from "@/components/layout";
import { RegionBanner } from "@/components/region";
import { ProductDetailSkeleton, ProductImageGallery, StarRating, ProductReviews, ProductCarousel } from "@/components/product";
import { useProductBySlug, useActiveProducts, DbProduct } from "@/hooks/useProducts";
import { useRegionProduct } from "@/hooks/useRegionProducts";
import { useRegion } from "@/contexts/RegionContext";
import { getAverageRating } from "@/data/reviews";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getRegionPriceInfo, getPriceChangeLabel } from "@/lib/productUtils";
import { cn } from "@/lib/utils";
import { Product, ProductVariant } from "@/types";
import { toast } from "sonner";

// Helper to convert DB product to frontend Product type
const convertDbProduct = (dbProduct: DbProduct): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  slug: dbProduct.slug,
  categoryId: dbProduct.category_id,
  categoryName: dbProduct.category_name,
  price: dbProduct.price,
  unit: dbProduct.unit,
  origin: dbProduct.origin,
  quality: dbProduct.quality,
  arrivalDate: dbProduct.arrival_date || new Date().toISOString().split("T")[0],
  availability: dbProduct.availability,
  isBugunHalde: dbProduct.is_bugun_halde,
  priceChange: dbProduct.price_change,
  previousPrice: dbProduct.previous_price ?? undefined,
  images: dbProduct.images,
  description: dbProduct.description ?? undefined,
  variants: (dbProduct.variants as unknown as ProductVariant[]) ?? undefined,
});

const ProductDetail = () => {
  const { slug } = useParams();
  const { selectedRegion } = useRegion();
  const { data: dbProduct, isLoading: isProductLoading } = useProductBySlug(slug || "");
  const { data: allProducts } = useActiveProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Convert DB product first to get the id
  const product = useMemo(() => {
    if (!dbProduct) return null;
    return convertDbProduct(dbProduct);
  }, [dbProduct]);
  
  // Bölge bazlı fiyat/stok bilgisi
  const { data: regionProductData } = useRegionProduct(selectedRegion?.id ?? null, product?.id ?? null);
  const regionInfo = useMemo(() => getRegionPriceInfo(regionProductData), [regionProductData]);
  
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [showStickyBar, setShowStickyBar] = useState(false);
  
  // Bölge durumları
  const isInRegion = regionInfo?.isInRegion ?? false;
  const isOutOfStock = regionInfo ? regionInfo.stockQuantity === 0 : false;
  const canAddToCart = !selectedRegion || (isInRegion && !isOutOfStock && regionInfo?.isAvailable);

  // Handle scroll for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get related products
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts
      .filter(p => p.category_id === product.categoryId && p.id !== product.id)
      .slice(0, 6)
      .map(convertDbProduct);
  }, [product, allProducts]);

  // Set default variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
    } else {
      setSelectedVariant(undefined);
    }
  }, [product]);

  const inWishlist = product ? isInWishlist(product.id) : false;

  // Fiyat: Bölge varsa bölge fiyatı, yoksa master fiyat
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = regionInfo?.price ?? product.price;
    const multiplier = selectedVariant?.priceMultiplier ?? 1;
    return basePrice * multiplier;
  }, [product, regionInfo, selectedVariant]);

  // Calculate savings percentage for variant
  const variantSavings = useMemo(() => {
    if (!selectedVariant || selectedVariant.priceMultiplier === 1) return null;
    const expectedMultiplier = selectedVariant.quantity;
    const actualMultiplier = selectedVariant.priceMultiplier;
    const savings = ((expectedMultiplier - actualMultiplier) / expectedMultiplier) * 100;
    return savings > 0 ? Math.round(savings) : null;
  }, [selectedVariant]);

  const handleAddToCart = useCallback(async () => {
    if (!product || isAdding) return;
    
    if (selectedRegion && !canAddToCart) {
      if (!isInRegion) {
        toast.error("Bu ürün seçili bölgede satılmamaktadır");
      } else if (isOutOfStock) {
        toast.error("Ürün stokta yok");
      }
      return;
    }
    
    setIsAdding(true);
    setShowAdded(true);
    addToCart(product, quantity, selectedVariant);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsAdding(false);
    setTimeout(() => setShowAdded(false), 2000);
  }, [product, quantity, isAdding, addToCart, selectedVariant, selectedRegion, canAddToCart, isInRegion, isOutOfStock]);

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  const handleNotifyStock = () => {
    toast.success("Ürün stoğa girdiğinde size haber vereceğiz!", {
      description: product?.name,
    });
  };


  if (isProductLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-24 lg:pb-0">
          <ProductDetailSkeleton />
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Ürün bulunamadı</p>
            <Button asChild>
              <Link to="/urunler">Ürünlere Dön</Link>
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const isToday = product.arrivalDate === new Date().toISOString().split("T")[0];
  const { average, count } = getAverageRating(product.id);

  const getAvailabilityInfo = () => {
    switch (product.availability) {
      case "plenty": return { label: "Bol Stok", className: "text-stock-plenty" };
      case "limited": return { label: "Sınırlı Stok", className: "text-stock-limited" };
      case "last": return { label: "Son Ürünler", className: "text-stock-last" };
    }
  };

  const availabilityInfo = getAvailabilityInfo();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-6">
          <Link 
            to="/urunler" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürünlere Dön
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <ProductImageGallery images={product.images} productName={product.name} />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{product.origin}</span>
                  <span className="text-border">|</span>
                  <span className={availabilityInfo.className}>{availabilityInfo.label}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{product.name}</h1>
                
                {/* Rating */}
                {count > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <StarRating rating={average} size="sm" showValue />
                    <span className="text-sm text-muted-foreground">({count} değerlendirme)</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {isToday && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-haldeki-green-light text-haldeki-green">
                      <Leaf className="h-4 w-4" />
                      Bugün Geldi
                    </span>
                  )}
                  {product.quality === "premium" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                      <Award className="h-4 w-4" />
                      Premium Kalite
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Miktar Seçin
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantPrice = product.price * variant.priceMultiplier;
                      const expectedPrice = product.price * variant.quantity;
                      const hasSavings = variantPrice < expectedPrice;
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={cn(
                            "relative flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[90px]",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50 bg-card"
                          )}
                        >
                          {hasSavings && (
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-accent text-accent-foreground rounded-full">
                              Avantajlı
                            </span>
                          )}
                          <span className={cn(
                            "text-sm font-semibold",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {variant.label}
                          </span>
                          <span className={cn(
                            "text-xs mt-1",
                            isSelected ? "text-primary/70" : "text-muted-foreground"
                          )}>
                            {variantPrice.toFixed(2)}₺
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 py-4 border-y">
                <span className="text-4xl font-bold text-foreground">{currentPrice.toFixed(2)}₺</span>
                {selectedVariant && (
                  <span className="text-lg text-muted-foreground">/ {selectedVariant.label}</span>
                )}
                {!selectedVariant && (
                  <span className="text-lg text-muted-foreground">/ {product.unit}</span>
                )}
                {variantSavings && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-sm font-medium bg-accent/20 text-accent">
                    %{variantSavings} tasarruf
                  </span>
                )}
                {product.previousPrice && !selectedVariant && (
                  <span className="text-lg text-muted-foreground line-through ml-2">
                    {product.previousPrice.toFixed(2)}₺
                  </span>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="touch-manipulation"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="touch-manipulation"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  className={cn(
                    "flex-1 h-12 text-lg transition-all touch-manipulation",
                    showAdded && "bg-stock-plenty hover:bg-stock-plenty"
                  )}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {showAdded ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Eklendi
                    </>
                  ) : isAdding ? (
                    "Ekleniyor..."
                  ) : (
                    "Sepete Ekle"
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12 shrink-0 touch-manipulation",
                    inWishlist && "border-accent text-accent"
                  )}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
                </Button>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                  <Truck className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Hızlı Teslimat</p>
                    <p className="text-muted-foreground">Aynı gün teslimat</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Tazelik Garantisi</p>
                    <p className="text-muted-foreground">%100 memnuniyet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-12">
            <Tabs defaultValue="details" className="w-full">
              <div className="border-b">
                <TabsList className="w-full grid grid-cols-3 md:inline-flex md:w-auto md:mx-auto md:flex rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="details"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 md:px-8 py-3 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Info className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Ürün </span>Detayları
                  </TabsTrigger>
                  <TabsTrigger 
                    value="delivery"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 md:px-8 py-3 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Truck className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Teslimat </span>Bilgileri
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 md:px-8 py-3 text-xs md:text-sm whitespace-nowrap"
                  >
                    <StarRating rating={average} size="sm" />
                    <span className="ml-1 md:ml-2">({count})</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="pt-8">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="text-center max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold mb-3">Ürün Açıklaması</h3>
                    <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-xl bg-secondary/30 space-y-4">
                      <h3 className="text-lg font-bold text-center">Ürün Bilgileri</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Menşei</span>
                          <span className="font-medium">{product.origin}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Kategori</span>
                          <span className="font-medium">{product.categoryName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Kalite</span>
                          <span className="font-medium capitalize">{product.quality}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Birim</span>
                          <span className="font-medium">{product.unit}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-secondary/30 space-y-4">
                      <h3 className="text-lg font-bold text-center">Saklama Koşulları</h3>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          Buzdolabında +4°C ile +8°C arasında saklayın
                        </li>
                        <li className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          Taze tüketim için 3-5 gün içinde kullanın
                        </li>
                        <li className="flex items-start gap-3">
                          <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          Yıkamadan önce buzdolabında saklayın
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="pt-8">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="grid gap-4">
                    <div className="p-6 rounded-xl border bg-card">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Aynı Gün Teslimat
                      </h3>
                      <p className="text-muted-foreground">
                        Saat 14:00'e kadar verilen siparişler aynı gün teslim edilir. 
                        Menemen ve çevre ilçelere ücretsiz teslimat.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl border bg-card">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Tazelik Garantisi
                      </h3>
                      <p className="text-muted-foreground">
                        Ürünlerimiz her gün taze olarak halden alınır. 
                        Memnun kalmazsanız iade veya değişim garantisi sunuyoruz.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl border bg-card">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Teslimat Bölgeleri
                      </h3>
                      <p className="text-muted-foreground">
                        Menemen, Aliağa, Foça, Çiğli ve Karşıyaka bölgelerine teslimat yapıyoruz. 
                        Minimum sipariş tutarı bölgeye göre değişmektedir.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="pt-8">
                <ProductReviews productId={product.id} productName={product.name} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Benzer Ürünler</h2>
              <ProductCarousel
                products={relatedProducts}
              />
            </div>
          )}
        </div>
      </main>

      {/* Sticky Add to Cart Bar (Mobile) */}
      <div className={cn(
        "fixed bottom-16 left-0 right-0 lg:hidden bg-background border-t p-4 transition-transform duration-300 z-40",
        showStickyBar ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{product.name}</p>
            <p className="text-lg font-bold text-primary">{currentPrice.toFixed(2)}₺</p>
          </div>
          <Button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="h-11 px-6"
          >
            {showAdded ? "Eklendi" : "Sepete Ekle"}
          </Button>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ProductDetail;
