import { useState, useMemo, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Heart, Leaf, Award, GitCompare, Ban, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Product, ProductVariant, RegionPriceInfo } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCompare } from "@/contexts/CompareContext";
import { useRegion } from "@/contexts/RegionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLowestPriceForCart } from "@/hooks/useLowestPriceForCart";
import { getPriceChangeLabel } from "@/lib/productUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  regionInfo?: RegionPriceInfo | null;
  variant?: "default" | "bugunHalde";
  priority?: boolean; // İlk 4 ürün için eager loading
}

const ProductCard = memo(({ product, regionInfo, variant = "default", priority = false }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const { selectedRegion } = useRegion();
  const { isBusiness } = useAuth();

  // Phase 12: Fetch lowest price across suppliers
  const { data: cartPriceInfo, isLoading: isLoadingPrice } = useLowestPriceForCart(
    product.id,
    selectedRegion?.id ?? null
  );

  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // Default variant selection
  const defaultVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return undefined;
    return product.variants.find(v => v.isDefault) || product.variants[0];
  }, [product.variants]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);

  // Bölge bilgisi durumları
  // regionInfo null = bölgede özel fiyat YOK, ama ürün varsayılan fiyatla satılıyor
  const isInRegion = regionInfo?.isInRegion ?? true;  // null varsayılan olarak "region'da var" demek
  const isOutOfStock = regionInfo ? regionInfo.stockQuantity === 0 : false;
  const canAddToCart = selectedRegion && isInRegion && !isOutOfStock && (regionInfo?.isAvailable ?? true);

  // Fiyat: Bölge varsa bölge fiyatı, yoksa master fiyat
  const displayPrice = useMemo(() => {
    const basePrice = (isBusiness && regionInfo?.businessPrice) 
      ? regionInfo.businessPrice 
      : (regionInfo?.price ?? product.price);
    const multiplier = selectedVariant?.priceMultiplier ?? 1;
    return basePrice * multiplier;
  }, [regionInfo, product.price, selectedVariant, isBusiness]);

  // Önceki fiyat (kampanya gösterimi için)
  const previousPrice = isBusiness ? (regionInfo?.price ?? product.price) : (regionInfo?.previousPrice ?? product.previousPrice);

  const getAvailabilityLabel = () => {
    // Bölgede yoksa
    if (selectedRegion && !isInRegion) {
      return { label: "Bu bölgede yok", className: "bg-muted text-muted-foreground" };
    }
    // Stok tükendiyse
    if (isOutOfStock) {
      return { label: "Tükendi", className: "bg-stock-last/10 text-stock-last" };
    }
    // Bölge bilgisi varsa region availability kullan
    if (regionInfo) {
      switch (regionInfo.availability) {
        case "plenty": return { label: "Bol Stok", className: "bg-stock-plenty/10 text-stock-plenty" };
        case "limited": return { label: "Sınırlı", className: "bg-stock-limited/10 text-stock-limited" };
        case "last": return { label: "Son Ürünler", className: "bg-stock-last/10 text-stock-last" };
      }
    }
    // Fallback: master product availability
    switch (product.availability) {
      case "plenty": return { label: "Bol Stok", className: "bg-stock-plenty/10 text-stock-plenty" };
      case "limited": return { label: "Sınırlı", className: "bg-stock-limited/10 text-stock-limited" };
      case "last": return { label: "Son Ürünler", className: "bg-stock-last/10 text-stock-last" };
    }
  };

  const isToday = product.arrivalDate === new Date().toISOString().split("T")[0];
  const availability = getAvailabilityLabel();

  const priceChangeLabel = useMemo(() => {
    return regionInfo?.priceChange
      ? getPriceChangeLabel(regionInfo.priceChange)
      : getPriceChangeLabel(product.priceChange);
  }, [regionInfo?.priceChange, product.priceChange]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canAddToCart) {
      if (!selectedRegion) {
        // requireRegion CartContext içinde zaten modal açıyor
      } else if (!isInRegion) {
        toast.error("Bu ürün seçili bölgede satılmamaktadır");
      } else if (isOutOfStock) {
        toast.error("Ürün stokta yok");
      }
      return;
    }

    const finalPrice = (isBusiness && regionInfo?.businessPrice)
      ? regionInfo.businessPrice
      : (cartPriceInfo?.price ?? regionInfo?.price ?? product.price);

    const supplierInfo = cartPriceInfo ? {
      supplierId: cartPriceInfo.supplierId,
      supplierProductId: cartPriceInfo.supplierProductId,
      supplierName: cartPriceInfo.supplierName,
      priceSource: cartPriceInfo.priceSource,
    } : undefined;

    addToCart(product, 1, selectedVariant, finalPrice, supplierInfo);
  }, [canAddToCart, selectedRegion, isInRegion, isOutOfStock, isBusiness, regionInfo, cartPriceInfo, product, selectedVariant, addToCart]);

  const handleNotifyStock = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("Ürün stoğa girdiğinde size haber vereceğiz!", {
      description: product.name,
    });
  }, [product.name]);

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const handleToggleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  }, [inCompare, product, removeFromCompare, addToCompare]);

  const handleVariantSelect = useCallback((e: React.MouseEvent, variantItem: ProductVariant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variantItem);
  }, []);

  return (
    <Card
      className={cn(
        "group overflow-hidden card-hover bg-card h-full flex flex-col",
        (selectedRegion && !isInRegion) && "opacity-60"
      )}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/urun/${product.slug}`} className="block" data-testid={`product-link-${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <OptimizedImage
            src={product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            width={400}
            height={400}
            priority={priority}
            className={cn(
              "transition-transform duration-500",
              canAddToCart && "group-hover:scale-105"
            )}
          />
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button
              onClick={handleToggleWishlist}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                inWishlist
                  ? "bg-accent text-accent-foreground"
                  : "bg-card/80 text-muted-foreground hover:bg-card hover:text-accent"
              )}
              data-testid={`wishlist-button-${product.id}`}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </button>
            <button
              onClick={handleToggleCompare}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                inCompare
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/80 text-muted-foreground hover:bg-card hover:text-primary"
              )}
              data-testid={`compare-button-${product.id}`}
            >
              <GitCompare className="h-4 w-4" />
            </button>
          </div>
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-haldeki-green-light text-haldeki-green">
                <Leaf className="h-3 w-3" />
                Bugün Geldi
              </span>
            )}
            {product.quality === "premium" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                <Award className="h-3 w-3" />
                Premium
              </span>
            )}
            {/* Fiyat değişim etiketi (kampanya dili) */}
            {priceChangeLabel && variant === "bugunHalde" && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                regionInfo?.priceChange === "down" || product.priceChange === "down"
                  ? "bg-fresh-down/20 text-fresh-down"
                  : "bg-fresh-up/20 text-fresh-up"
              )}>
                {priceChangeLabel}
              </span>
            )}
            {/* Bölgede yok badge */}
            {selectedRegion && !isInRegion && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Ban className="h-3 w-3" />
                Bu bölgede yok
              </span>
            )}
            {/* Tükendi badge */}
            {isOutOfStock && isInRegion && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stock-last/20 text-stock-last">
                Tükendi
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
          <Link to={`/urun/${product.slug}`} data-testid={`product-name-${product.id}`}>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-xs px-2 py-0.5 rounded-full", availability.className)}>
            {availability.label}
          </span>
          {/* Stok miktarı göster (bölge varsa) */}
          {regionInfo && regionInfo.stockQuantity > 0 && regionInfo.stockQuantity <= 20 && (
            <span className="text-xs text-muted-foreground">
              {regionInfo.stockQuantity} {product.unit}
            </span>
          )}
        </div>

        {/* Quick Variant Selector */}
        <div className="min-h-[40px] flex items-center">
          {product.variants && product.variants.length > 0 ? (
            <div className="flex flex-wrap gap-1">
            {product.variants.slice(0, 4).map((variantItem) => {
              const isSelected = selectedVariant?.id === variantItem.id;
              return (
                <button
                  key={variantItem.id}
                  onClick={(e) => handleVariantSelect(e, variantItem)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md border transition-all min-w-[44px] min-h-[32px]",
                    "active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {variantItem.label}
                </button>
              );
            })}
          </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-2 border-t shrink-0 mt-auto">
          <div data-testid={`product-price-${product.id}`}>
            <span className="text-xl font-bold text-foreground">
              {displayPrice.toFixed(2)}₺
            </span>
            <span className="text-sm text-muted-foreground">
              /{selectedVariant?.label || product.unit}
            </span>
            {/* Önceki fiyat göster */}
            {previousPrice && previousPrice > displayPrice && (
              <span className="block text-xs text-muted-foreground line-through">
                {previousPrice.toFixed(2)}₺
              </span>
            )}
          </div>
          
          {/* Sepete Ekle / Tükendi / Haber Ver */}
          {isOutOfStock && isInRegion ? (
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              onClick={handleNotifyStock}
              title="Gelince haber ver"
              data-testid={`notify-stock-button-${product.id}`}
            >
              <Bell className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full",
                canAddToCart
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              onClick={handleAddToCart}
              disabled={!canAddToCart || isLoadingPrice}
              data-testid={`add-to-cart-button-${product.id}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
