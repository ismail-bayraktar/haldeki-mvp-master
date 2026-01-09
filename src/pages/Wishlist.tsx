import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useRegion } from "@/contexts/RegionContext";
import { useLowestPriceForCart } from "@/hooks/useLowestPriceForCart";
import { Card } from "@/components/ui/card";

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { selectedRegion } = useRegion();

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product, 1, undefined, undefined, undefined);
    removeFromWishlist(product.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8 md:py-12 bg-secondary/30">
          <div className="container">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Favorilerim
                </h1>
                <p className="text-muted-foreground mt-1">
                  {items.length} ürün kayıtlı
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            {items.length > 0 ? (
              <>
                <div className="flex justify-end mb-6">
                  <Button variant="outline" onClick={clearWishlist} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Tümünü Temizle
                  </Button>
                </div>

                <div className="grid gap-4">
                  {items.map((product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex gap-4">
                        <Link to={`/urun/${product.slug}`} className="shrink-0">
                          <img
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link to={`/urun/${product.slug}`}>
                            <h3 className="font-bold text-foreground hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{product.origin}</p>
                          <p className="text-lg font-bold mt-2">
                            {product.price.toFixed(2)}₺
                            <span className="text-sm font-normal text-muted-foreground">
                              /{product.unit}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            className="gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span className="hidden sm:inline">Sepete Ekle</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromWishlist(product.id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Kaldır</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Favorileriniz boş
                </h2>
                <p className="text-muted-foreground mb-6">
                  Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
                </p>
                <Button asChild>
                  <Link to="/urunler">
                    Ürünleri Keşfet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
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

export default Wishlist;
