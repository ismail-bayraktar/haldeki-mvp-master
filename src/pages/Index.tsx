import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Clock, Leaf, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";
import { ProductCarousel, CategoryCard } from "@/components/product";
import { HeroSection, TodaysDealsHighlight, ServiceAreaMap, CustomerReviews, OrderCounter } from "@/components/home";
import { LocalBusinessSchema, DeliveryAreaSchema, PageMeta } from "@/components/seo";
import { categories } from "@/data/categories";
import { useActiveProducts, DbProduct } from "@/hooks/useProducts";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types";

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

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: dbProducts, refetch } = useActiveProducts();

  // Convert DB products to frontend type
  const products = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.map(convertDbProduct);
  }, [dbProducts]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.quality === "premium").slice(0, 8);
  }, [products]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Yenilendi",
      description: "Güncel fiyatlar yüklendi.",
    });
  }, [refetch]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const features = [
    { icon: Truck, title: "Ucretsiz Teslimat", desc: "150 TL uzeri siparislerde" },
    { icon: Shield, title: "Guvenli Alisveris", desc: "Kalite garantisi" },
    { icon: Clock, title: "Hizli Teslimat", desc: "Ayni gun teslimat" },
    { icon: Leaf, title: "Taze Urunler", desc: "Halden sofraniza" },
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col overflow-y-auto"
    >
      <PageMeta
        title="Haldeki - Menemen Aliağa Taze Meyve Sebze Teslimatı"
        description="İzmir Menemen ve Aliağa'ya aynı gün taze meyve sebze teslimatı. Toptan hal fiyatlarına online sipariş. Halden kapınıza taze ürünler."
        keywords="menemen meyve sebze, aliağa taze sebze, izmir hal, online meyve sipariş, taze sebze teslimat"
        canonicalUrl="https://haldeki.com"
      />
      <LocalBusinessSchema />
      <DeliveryAreaSchema
        areas={[
          { name: "Menemen", locality: "Menemen", region: "İzmir" },
          { name: "Aliağa", locality: "Aliağa", region: "İzmir" },
        ]}
      />

      <PullToRefreshIndicator
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
      />
      
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0" key={refreshKey}>
        <HeroSection />
        
        {/* Order Counter - Social Proof */}
        <OrderCounter />

        {/* Features Bar */}
        <section className="py-8 border-b bg-card">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 touch-manipulation active:scale-95 transition-transform">
                  <div className="p-2 rounded-full bg-secondary">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TodaysDealsHighlight />

        {/* Premium Products */}
        <section className="py-12 md:py-16 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Premium Ürünler
                  </h2>
                  <p className="text-muted-foreground mt-1">En kaliteli seçimler</p>
                </div>
              </div>
              <Button variant="outline" className="hidden sm:flex touch-manipulation" asChild>
                <Link to="/urunler?category=all">
                  Tümünü Gör
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <ProductCarousel products={featuredProducts} />
            
            <div className="mt-4 sm:hidden">
              <Button variant="outline" className="w-full touch-manipulation" asChild>
                <Link to="/urunler">
                  Tümünü Gör
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Kategoriler
              </h2>
              <p className="text-muted-foreground mt-2">Taze ürünlerimizi keşfedin</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Service Area Map */}
        <ServiceAreaMap />

        {/* Customer Reviews */}
        <CustomerReviews />
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;
