import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Search, Filter, SlidersHorizontal, TrendingDown } from "lucide-react";
import { ComparisonCard } from "@/components/admin/ComparisonCard";
import { useMultiSupplierProducts, useBugunHaldeCategories } from "@/hooks/useBugunHalde";
import type { BugunHaldeFilters } from "@/types/multiSupplier";
import { useBugunHaldeComparisonGrouped } from "@/hooks/useBugunHalde";
import { BugunHaldeComparisonRow } from "@/types/multiSupplier";
const AdminBugunHalde = () => {
  const [filters, setFilters] = useState<BugunHaldeFilters>({
    minSuppliers: 2,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch grouped comparison data
  const { data: groupedProducts, isLoading, refetch } = useBugunHaldeComparisonGrouped(filters);

  // Fetch categories for filter dropdown
  const { data: categories } = useBugunHaldeCategories();

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery: searchQuery || undefined,
      category: selectedCategory || undefined,
    }));
  }, [searchQuery, selectedCategory]);

  const handleFilterChange = (key: keyof BugunHaldeFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setFilters({ minSuppliers: 2 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const productCount = groupedProducts?.length || 0;
  const supplierCount = groupedProducts?.reduce((sum, suppliers) => sum + suppliers.length, 0) || 0;

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="h-6 w-6 text-green-600" />
              Bugün Halde - Fiyat Karşılaştırması
            </h1>
            <p className="text-muted-foreground">Tedarikçiler arası fiyat karşılaştırması</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtreler
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Karşılaştırılabilir Ürün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{productCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Birden fazla tedarikçiye sahip
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Toplam Teklif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{supplierCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm tedarikçilerden
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Farklı ürün kategorisi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Ürün Ara</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ürün adı..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Tümü</option>
                  {categories?.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Suppliers */}
              <div className="space-y-2">
                <Label>Min. Tedarikçi Sayısı</Label>
                <Input
                  type="number"
                  min="2"
                  value={filters.minSuppliers || 2}
                  onChange={(e) => handleFilterChange("minSuppliers", parseInt(e.target.value) || 2)}
                />
              </div>

              {/* Only Lowest Price */}
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 h-10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyLowestPrice || false}
                    onChange={(e) => handleFilterChange("onlyLowestPrice", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Sadece en iyi fiyatlar</span>
                </label>
              </div>
            </div>

            {(filters.category || filters.minSuppliers !== 2 || filters.onlyLowestPrice) && (
              <div className="mt-4">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      {groupedProducts && groupedProducts.length > 0 ? (
        <div className="grid gap-6">
          {groupedProducts.map((suppliers) => {
            const product = suppliers[0] as BugunHaldeComparisonRow;
            return (
              <ComparisonCard
                key={product.product_id}
                product={product.product_name}
                productImage={product.image_url}
                category={product.category}
                suppliers={suppliers as BugunHaldeComparisonRow[]}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Karşılaştırma bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory
                  ? "Seçtiğiniz filtrelere uygun ürün bulunamadı."
                  : "Henüz birden fazla tedarikçisi olan ürün yok."}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button variant="outline" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBugunHalde;
