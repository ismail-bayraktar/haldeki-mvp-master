import { Link } from "react-router-dom";
import { ArrowLeft, X, ShoppingCart, GitCompare, Plus, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useCompare } from "@/contexts/CompareContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare, maxItems } = useCompare();
  const { addToCart } = useCart();

  const specifications = [
    { key: "origin", label: "Mensei" },
    { key: "quality", label: "Kalite" },
    { key: "unit", label: "Birim" },
    { key: "availability", label: "Stok Durumu" },
    { key: "categoryName", label: "Kategori" },
    { key: "priceChange", label: "Fiyat Degisimi" },
  ];

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "premium": return "Premium";
      case "standart": return "Standart";
      case "ekonomik": return "Ekonomik";
      default: return quality;
    }
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case "plenty": return { label: "Bol Stok", className: "text-stock-plenty" };
      case "limited": return { label: "Sinirli", className: "text-stock-limited" };
      case "last": return { label: "Son Urunler", className: "text-stock-last" };
      default: return { label: availability, className: "" };
    }
  };

  const getPriceChangeIcon = (priceChange: string) => {
    switch (priceChange) {
      case "up": return <TrendingUp className="h-4 w-4 text-fresh-up" />;
      case "down": return <TrendingDown className="h-4 w-4 text-fresh-down" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSpecValue = (product: any, key: string) => {
    const value = product[key];
    switch (key) {
      case "quality":
        return getQualityLabel(value);
      case "availability":
        const avail = getAvailabilityLabel(value);
        return <span className={avail.className}>{avail.label}</span>;
      case "priceChange":
        return (
          <span className="flex items-center gap-1">
            {getPriceChangeIcon(value)}
            {value === "up" ? "Artti" : value === "down" ? "Dustu" : "Sabit"}
          </span>
        );
      case "unit":
        return value === "kg" ? "Kilogram" : value === "adet" ? "Adet" : value === "demet" ? "Demet" : "Paket";
      default:
        return value;
    }
  };

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">
          <section className="py-8 md:py-12 bg-secondary/30">
            <div className="container">
              <Link 
                to="/urunler" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Urunlere don
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Urun Karsilastirma</h1>
            </div>
          </section>

          <section className="py-16">
            <div className="container text-center">
              <GitCompare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Karsilastirma listeniz bos
              </h2>
              <p className="text-muted-foreground mb-6">
                Urunleri karsilastirmak icin urun kartlarindaki karsilastirma butonunu kullanin.
              </p>
              <Button asChild>
                <Link to="/urunler">
                  <Plus className="h-4 w-4 mr-2" />
                  Urun Ekle
                </Link>
              </Button>
            </div>
          </section>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8 md:py-12 bg-secondary/30">
          <div className="container">
            <Link 
              to="/urunler" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Urunlere don
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Urun Karsilastirma</h1>
                <p className="text-muted-foreground mt-2">
                  {compareItems.length} / {maxItems} urun karsilastiriliyor
                </p>
              </div>
              <Button variant="outline" onClick={clearCompare} className="gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tumunu Temizle</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Product Cards Row */}
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${compareItems.length}, 1fr)` }}>
                <div className="flex items-end pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Urunler</span>
                </div>
                {compareItems.map((product) => (
                  <Card key={product.id} className="relative overflow-hidden bg-card">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Link to={`/urun/${product.slug}`}>
                      <div className="aspect-square overflow-hidden bg-secondary/30">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/urun/${product.slug}`}>
                        <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-xl font-bold text-foreground">
                            {product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">/{product.unit}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 gap-2"
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Sepete Ekle
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Specifications Table */}
              <Card className="overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {specifications.map((spec, index) => (
                      <tr 
                        key={spec.key}
                        className={cn(
                          "border-b last:border-b-0",
                          index % 2 === 0 ? "bg-secondary/30" : "bg-card"
                        )}
                      >
                        <td className="p-4 font-medium text-foreground w-[200px]">
                          {spec.label}
                        </td>
                        {compareItems.map((product) => (
                          <td key={product.id} className="p-4 text-center text-foreground">
                            {getSpecValue(product, spec.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Price Row */}
                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                      <td className="p-4 font-bold text-foreground w-[200px]">
                        Fiyat
                      </td>
                      {compareItems.map((product) => (
                        <td key={product.id} className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-primary">
                              {product.price.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">/{product.unit}</span>
                            {product.previousPrice && (
                              <span className="text-sm line-through text-muted-foreground">
                                {product.previousPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Card>

              {/* Add More Products */}
              {compareItems.length < maxItems && (
                <div className="mt-6 text-center">
                  <Button asChild variant="outline" size="lg">
                    <Link to="/urunler">
                      <Plus className="h-4 w-4 mr-2" />
                      Daha Fazla Urun Ekle ({maxItems - compareItems.length} kaldi)
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Compare;
