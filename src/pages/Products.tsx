import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, icons, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header, Footer, MobileNav } from "@/components/layout";
import { ProductCard, ProductCardSkeleton } from "@/components/product";
import { RegionBanner } from "@/components/region";
import { useActiveProducts, DbProduct } from "@/hooks/useProducts";
import { useRegionProducts } from "@/hooks/useRegionProducts";
import { useRegion } from "@/contexts/RegionContext";
import { useAuth } from "@/contexts/AuthContext";
import { mergeProductsWithRegion, sortByAvailability } from "@/lib/productUtils";
import { categories } from "@/data/categories";
import { Product, ProductWithRegionInfo } from "@/types";

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "newest";

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

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("kategori") || null
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  const { selectedRegion } = useRegion();
  const { isBusiness } = useAuth();
  const { data: dbProducts, isLoading: isProductsLoading } = useActiveProducts();
  const { data: regionProducts, isLoading: isRegionLoading } = useRegionProducts(selectedRegion?.id ?? null);

  const isLoading = isProductsLoading || (selectedRegion && isRegionLoading);

  // Convert DB products to frontend type
  const products = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.map(convertDbProduct);
  }, [dbProducts]);

  // Merge products with region info (client-side merge strategy)
  const productsWithRegion: ProductWithRegionInfo[] = useMemo(() => {
    if (!products.length) return [];
    
    // Bölge yoksa veya region products henüz yüklenmediyse, regionInfo null olarak döndür
    const merged = mergeProductsWithRegion(products, regionProducts ?? []);
    return sortByAvailability(merged);
  }, [products, regionProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...productsWithRegion];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.origin.toLowerCase().includes(query) ||
          p.categoryName.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          categories.find((c) => c.slug === selectedCategory)?.id === p.categoryId
      );
    }

    // Sort - bölge fiyatı varsa onu kullan, yoksa master fiyatı
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name, "tr"));
        break;
      case "price-asc":
        filtered.sort((a, b) => {
          const aPrice = (isBusiness && a.regionInfo?.businessPrice) ? a.regionInfo.businessPrice : (a.regionInfo?.price ?? a.price);
          const bPrice = (isBusiness && b.regionInfo?.businessPrice) ? b.regionInfo.businessPrice : (b.regionInfo?.price ?? b.price);
          return aPrice - bPrice;
        });
        break;
      case "price-desc":
        filtered.sort((a, b) => {
          const aPrice = (isBusiness && a.regionInfo?.businessPrice) ? a.regionInfo.businessPrice : (a.regionInfo?.price ?? a.price);
          const bPrice = (isBusiness && b.regionInfo?.businessPrice) ? b.regionInfo.businessPrice : (b.regionInfo?.price ?? b.price);
          return bPrice - aPrice;
        });
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
        break;
    }

    return filtered;
  }, [productsWithRegion, searchQuery, selectedCategory, sortBy, isBusiness]);

  const handleCategoryClick = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    if (categorySlug) {
      setSearchParams({ kategori: categorySlug });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortBy("newest");
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== "newest";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8 md:py-12 bg-secondary/30">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tüm Ürünler</h1>
            <p className="text-muted-foreground mt-2">Taze meyve ve sebzeler</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            {/* Region Banner - bölge seçilmediyse göster */}
            <RegionBanner className="mb-6" />

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ürün, menşei veya kategori ara..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px] bg-card">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border shadow-lg z-50">
                    <SelectItem value="newest">En Yeni</SelectItem>
                    <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                    <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                    <SelectItem value="name-asc">İsim: A-Z</SelectItem>
                    <SelectItem value="name-desc">İsim: Z-A</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(null)}
                className="rounded-full touch-manipulation"
              >
                Tümü
              </Button>
              {categories.map((cat) => {
                const IconComponent = icons[cat.iconName as keyof typeof icons] as LucideIcon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="rounded-full gap-1.5 touch-manipulation"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} ürün bulundu
                {selectedCategory && (
                  <span className="ml-1">
                    • {categories.find((c) => c.slug === selectedCategory)?.name}
                  </span>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    regionInfo={product.regionInfo}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl font-medium text-foreground mb-2">Ürün bulunamadı</p>
                <p className="text-muted-foreground mb-4">
                  Arama kriterlerinizi değiştirmeyi deneyin
                </p>
                <Button onClick={clearFilters}>Filtreleri Temizle</Button>
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

export default Products;
