import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Truck, Home, PartyPopper, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useCart } from "@/contexts/CartContext";
import Confetti from "@/components/ui/confetti";

const OrderComplete = () => {
  const { clearCart } = useCart();
  const [showConfetti, setShowConfetti] = useState(true);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || `HD${Date.now().toString().slice(-8)}`;
  const paymentMethod = searchParams.get("payment");
  const isEftPayment = paymentMethod === "eft";
  
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showConfetti && <Confetti />}
      
      <main className="flex-1 pb-20 lg:pb-0 flex items-center justify-center">
        <div className="container max-w-lg text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stock-plenty/20 flex items-center justify-center animate-bounce-soft">
            <CheckCircle className="h-10 w-10 text-stock-plenty" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Siparişiniz Alındı!</h1>
          <p className="text-muted-foreground mb-8">
            Taze ürünleriniz hazırlanıyor ve en kısa sürede kapınızda olacak.
          </p>

          <Card className="p-6 mb-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Sipariş No</span>
              <span className="font-bold">{orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tahmini Teslimat</span>
              <span className="font-medium">
                {estimatedDelivery.toLocaleDateString("tr-TR", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long" 
                })}
              </span>
            </div>
          </Card>

          {/* EFT Payment Notification */}
          {isEftPayment && (
            <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold mb-2">EFT/Havale Ödemesi</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ödeme yaptıktan sonra lütfen bildirim formunu doldurun. Bildiriminiz doğrulandıktan sonra siparişiniz hazırlanmaya başlayacaktır.
                  </p>
                  <Button asChild variant="default" className="w-full sm:w-auto">
                    <Link to={`/odeme-bildirimi/${orderId}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ödeme Bildirimi Yap
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Order Timeline */}
          <Card className="p-6 mb-8">
            <h3 className="font-bold mb-4 text-left">Sipariş Durumu</h3>
            <div className="space-y-4">
              {[
                { icon: CheckCircle, label: "Sipariş Alındı", active: true },
                { icon: Package, label: "Hazırlanıyor", active: false },
                { icon: Truck, label: "Yola Çıktı", active: false },
                { icon: Home, label: "Teslim Edildi", active: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.active ? "bg-stock-plenty/20 text-stock-plenty" : "bg-muted text-muted-foreground"
                  }`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className={step.active ? "font-medium" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-fresh-orange-light rounded-2xl p-6 mb-8">
            <PartyPopper className="h-8 w-8 text-fresh-orange mx-auto mb-3" />
            <p className="text-sm font-medium">
              Bu bir <span className="text-fresh-orange">demo sipariştir</span>. 
              Gerçek bir teslimat yapılmayacaktır.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/urunler">Alışverişe Devam Et</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/">Ana Sayfaya Dön</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default OrderComplete;
