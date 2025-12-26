import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRegion } from "@/contexts/RegionContext";
import { useEffect } from "react";

const Cart = () => {
  const { items, itemCount, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, openAuthDrawer } = useAuth();
  const { selectedRegion, openRegionModal, getSelectedRegionDetails } = useRegion();
  const navigate = useNavigate();

  // Bölge detaylarını al (min sipariş, teslimat ücreti vb.)
  const regionDetails = getSelectedRegionDetails();
  
  // Bölge yoksa teslimat hesaplaması yapılmaz (hardcode fallback yok!)
  const canCalculateDelivery = !!regionDetails;
  const freeDeliveryThreshold = regionDetails?.free_delivery_threshold ?? null;
  const baseDeliveryFee = regionDetails?.delivery_fee ?? null;
  
  // Sadece bölge varsa teslimat ücreti hesapla
  const deliveryFee = canCalculateDelivery && freeDeliveryThreshold !== null && baseDeliveryFee !== null
    ? (total >= freeDeliveryThreshold ? 0 : baseDeliveryFee)
    : null;
  
  const grandTotal = deliveryFee !== null ? total + deliveryFee : null;

  // Sepet sayfasına bölge seçmeden girilirse modal aç
  useEffect(() => {
    if (items.length > 0 && !selectedRegion) {
      openRegionModal();
    }
  }, [items.length, selectedRegion, openRegionModal]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openAuthDrawer();
      return;
    }

    if (!selectedRegion) {
      openRegionModal();
      return;
    }

    navigate("/teslimat");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sepetiniz Boş</h1>
            <p className="text-muted-foreground mb-6">
              Taze meyve ve sebzeler sizi bekliyor!
            </p>
            <Button asChild>
              <Link to="/urunler">Alışverişe Başla</Link>
            </Button>
          </div>
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Sepetim</h1>
            <p className="text-muted-foreground mt-2">{itemCount} ürün</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                  // 2A.3: unitPriceAtAdd kullan (TEK KAYNAK)
                  const itemPrice = item.unitPriceAtAdd * (item.selectedVariant?.priceMultiplier ?? 1);
                  const itemKey = item.selectedVariant 
                    ? `${item.productId}-${item.selectedVariant.id}` 
                    : item.productId;
                  
                  return (
                    <Card key={itemKey} className="p-4">
                      <div className="flex gap-4">
                        <Link to={`/urun/${item.product.slug}`} className="shrink-0">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{item.product.origin}</p>
                              <Link to={`/urun/${item.product.slug}`}>
                                <h3 className="font-bold hover:text-primary transition-colors">
                                  {item.product.name}
                                </h3>
                              </Link>
                              {item.selectedVariant && (
                                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                  {item.selectedVariant.label}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.productId, item.selectedVariant?.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedVariant?.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedVariant?.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {(itemPrice * item.quantity).toFixed(2)}₺
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {itemPrice.toFixed(2)}₺/{item.selectedVariant?.label || item.product.unit}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                <Button variant="outline" onClick={clearCart} className="w-full">
                  Sepeti Temizle
                </Button>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="font-bold text-lg mb-4">Sipariş Özeti</h2>
                  
                  {selectedRegion && (
                    <div className="mb-4 p-3 rounded-lg bg-secondary/50 text-sm">
                      <p className="font-medium">{selectedRegion.name}</p>
                      {regionDetails && (
                        <p className="text-muted-foreground text-xs mt-1">
                          Min. sipariş: {regionDetails.min_order_amount}₺
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ara Toplam</span>
                      <span>{total.toFixed(2)}₺</span>
                    </div>
                    
                    {canCalculateDelivery ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Teslimat</span>
                          <span className={deliveryFee === 0 ? "text-stock-plenty" : ""}>
                            {deliveryFee === 0 ? "Ücretsiz" : `${deliveryFee?.toFixed(2)}₺`}
                          </span>
                        </div>
                        {freeDeliveryThreshold && total < freeDeliveryThreshold && (
                          <p className="text-xs text-muted-foreground">
                            {(freeDeliveryThreshold - total).toFixed(2)}₺ daha ekleyin, kargo bedava!
                          </p>
                        )}
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between text-base font-bold">
                          <span>Toplam</span>
                          <span>{grandTotal?.toFixed(2)}₺</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-px bg-border my-2" />
                        <div className="p-3 rounded-lg bg-stock-limited/10 border border-stock-limited/20">
                          <p className="text-sm font-medium text-stock-limited">
                            Teslimat ücreti ve toplam için bölge seçin
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {!selectedRegion && (
                    <p className="text-xs text-stock-limited mt-4">
                      Devam etmek için teslimat bölgesi seçmelisiniz.
                    </p>
                  )}

                  <Button 
                    className="w-full mt-6 h-12 text-base gap-2"
                    onClick={handleCheckout}
                    disabled={!selectedRegion}
                  >
                    {!isAuthenticated ? "Giriş Yap" : "Devam Et"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Cart;
