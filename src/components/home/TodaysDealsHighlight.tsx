import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBugunHaldeProducts, DbProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Product, ProductVariant } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

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

const TodaysDealsHighlight = () => {
  const { data: dbProducts, isLoading } = useBugunHaldeProducts();
  const { addToCart } = useCart();

  // Convert DB products to frontend type
  const products = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.map(convertDbProduct).slice(0, 6);
  }, [dbProducts]);

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-secondary/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-shrink-0 w-44 md:w-52">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-full mt-3" />
                <Skeleton className="h-6 w-20 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-secondary/50">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Bugun Halden Secmeler
            </h2>
            <p className="text-muted-foreground mt-1">
              Gunun en taze firsatlari
            </p>
          </div>
          <Button variant="ghost" className="hidden sm:flex text-primary" asChild>
            <Link to="/bugun-halde">
              Tumunu Gor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Horizontal Scrollable Products */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-44 md:w-52 snap-start"
            >
              <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Product Image - Clickable */}
                <Link to={`/urun/${product.slug}`}>
                  <div className="relative aspect-square bg-secondary/30 overflow-hidden cursor-pointer">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Freshness Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      Bugun Halde
                    </div>

                    {/* Stock Indicator */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1">
                      <Circle 
                        className={`h-2 w-2 fill-current ${
                          product.availability === "plenty" 
                            ? "text-stock-plenty" 
                            : product.availability === "limited" 
                            ? "text-stock-limited" 
                            : "text-stock-last"
                        }`} 
                      />
                      <span className="text-xs text-foreground/70">
                        {product.availability === "plenty" 
                          ? "Stokta" 
                          : product.availability === "limited" 
                          ? "Sinirli" 
                          : "Son"}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-3">
                  <Link to={`/urun/${product.slug}`}>
                    <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">
                    {product.origin}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary">
                      {product.price.toFixed(2)} TL
                      <span className="text-xs font-normal text-muted-foreground">
                        /{product.unit}
                      </span>
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => addToCart(product)}
                  >
                    Sepete Ekle
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-4 sm:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/bugun-halde">
              Tumunu Gor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TodaysDealsHighlight;
