import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Plus, Check, Clock, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRegion } from "@/contexts/RegionContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmailService } from "@/hooks/useEmailService";
import { DeliverySlot, ProcessedDeliverySlot } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Address {
  id: string;
  title: string;
  fullAddress: string;
  phone: string;
  instructions?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { selectedRegion, openRegionModal, getSelectedRegionDetails } = useRegion();
  const { sendOrderConfirmation, sendOrderNotification } = useEmailService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [step, setStep] = useState<"address" | "delivery" | "summary">("address");
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      title: "Ev",
      fullAddress: "Örnek Mahallesi, Örnek Sokak No:1 Daire:1, Kadıköy/İstanbul",
      phone: "0532 123 45 67",
      instructions: "Kapıda zil yok, lütfen arayın",
    },
  ]);
  const [selectedAddress, setSelectedAddress] = useState<string>("1");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: "",
    fullAddress: "",
    phone: "",
    instructions: "",
  });

  // Bölge detaylarını al - HARDCODE FALLBACK YOK!
  const regionDetails = getSelectedRegionDetails();
  const canCalculateDelivery = !!regionDetails;
  const freeDeliveryThreshold = regionDetails?.free_delivery_threshold ?? null;
  const baseDeliveryFee = regionDetails?.delivery_fee ?? null;
  
  // DB'den gelen teslimat slotları
  const deliverySlots: DeliverySlot[] = (regionDetails?.delivery_slots as DeliverySlot[] | null) ?? [];
  
  const deliveryFee = canCalculateDelivery && freeDeliveryThreshold !== null && baseDeliveryFee !== null
    ? (total >= freeDeliveryThreshold ? 0 : baseDeliveryFee)
    : null;
  
  const grandTotal = deliveryFee !== null ? total + deliveryFee : null;

  // Region Gate: Bölge seçilmeden checkout'a erişilemez
  useEffect(() => {
    if (!selectedRegion && items.length > 0) {
      openRegionModal();
    }
  }, [selectedRegion, items.length, openRegionModal]);

  // Redirect if not authenticated, no items
  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">Lütfen önce giriş yapın ve sepetinize ürün ekleyin.</p>
            <Button asChild>
              <Link to="/sepet">Sepete Git</Link>
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Bölge yoksa içeriği blokla, modal açık bekle
  if (!selectedRegion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium mb-2">Teslimat bölgesi gerekli</p>
            <p className="text-muted-foreground mb-4">Devam etmek için lütfen bölgenizi seçin</p>
            <Button onClick={openRegionModal}>Bölge Seç</Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const handleAddAddress = () => {
    if (!newAddress.title || !newAddress.fullAddress || !newAddress.phone) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }
    
    const id = Date.now().toString();
    setAddresses([...addresses, { ...newAddress, id }]);
    setSelectedAddress(id);
    setShowNewAddress(false);
    setNewAddress({ title: "", fullAddress: "", phone: "", instructions: "" });
    toast.success("Adres eklendi");
  };

  const handleContinue = () => {
    if (step === "address") {
      if (!selectedAddress) {
        toast.error("Lütfen bir adres seçin");
        return;
      }
      setStep("delivery");
    } else if (step === "delivery") {
      if (!selectedSlot) {
        toast.error("Lütfen teslimat saati seçin");
        return;
      }
      setStep("summary");
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedAddressData = addresses.find(a => a.id === selectedAddress);
      const selectedSlotData = deliverySlots.find(s => s.id === selectedSlot);

      const orderItems = items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.quantity * item.product.price * (item.selectedVariant?.priceMultiplier ?? 1),
        variantId: item.selectedVariant?.id || null,
        variantLabel: item.selectedVariant?.label || null,
      }));

      const deliveryNote = selectedSlotData ? `${selectedSlotData.date} - ${selectedSlotData.label}` : undefined;

      const { data: orderData, error } = await supabase.from('orders').insert([{
        user_id: user.id,
        region_id: selectedRegion.id,
        status: 'pending',
        total_amount: grandTotal,
        shipping_address: {
          title: selectedAddressData?.title,
          fullAddress: selectedAddressData?.fullAddress,
          phone: selectedAddressData?.phone,
          instructions: selectedAddressData?.instructions,
        },
        items: orderItems,
        notes: deliveryNote ? `Teslimat: ${deliveryNote}` : null,
      }]).select('id').single();

      if (error) {
        console.error('Order error:', error);
        toast.error("Sipariş oluşturulurken bir hata oluştu");
        return;
      }

      const orderId = orderData?.id;

      // Send email notifications (don't block on failures)
      try {
        // 1. Send confirmation email to customer
        const customerEmail = user.email;
        const customerName = user.user_metadata?.full_name || 'Değerli Müşterimiz';
        
        if (customerEmail && orderId) {
          await sendOrderConfirmation(
            customerEmail,
            customerName,
            orderId,
            selectedRegion.name,
            grandTotal || total,
            orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              totalPrice: item.totalPrice
            })),
            selectedAddressData?.fullAddress || '',
            deliveryNote
          );
          console.log('[Checkout] Customer confirmation email sent');
        }

        // 2. Send notification to dealers in this region
        const { data: dealers } = await supabase
          .from('dealers')
          .select('contact_email, name')
          .contains('region_ids', [selectedRegion.id])
          .eq('is_active', true);

        if (dealers && dealers.length > 0 && orderId) {
          for (const dealer of dealers) {
            if (dealer.contact_email) {
              await sendOrderNotification(
                dealer.contact_email,
                orderId,
                selectedRegion.name,
                grandTotal || total
              );
              console.log(`[Checkout] Dealer notification sent to: ${dealer.contact_email}`);
            }
          }
        }
      } catch (emailError) {
        // Don't fail the order if emails fail
        console.error('[Checkout] Email notification error:', emailError);
      }

      clearCart();
      toast.success("Siparişiniz başarıyla oluşturuldu!");
      navigate("/siparis-tamamlandi");
    } catch (error) {
      console.error('Order error:', error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2A.4: Slotları sırala ve geçmiş slotları işaretle
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const processedSlots: ProcessedDeliverySlot[] = deliverySlots
    .map((slot) => {
      // Geçmiş slot kontrolü: bugün için start saati geçmiş mi?
      let isPast = false;
      if (slot.date === today && (slot as any).start) {
        const [hours, minutes] = (slot as any).start.split(":").map(Number);
        const slotTime = hours * 60 + (minutes || 0);
        isPast = currentTime > slotTime;
      }
      return { ...slot, isPast };
    })
    .sort((a, b) => {
      // Önce tarihe göre, sonra start saatine göre sırala
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const aStart = (a as any).start || "00:00";
      const bStart = (b as any).start || "00:00";
      return aStart.localeCompare(bStart);
    });

  const groupedSlots = processedSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof processedSlots>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-6 bg-secondary/30">
          <div className="container">
            <Link to="/sepet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Sepete Dön
            </Link>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-4">
              {["address", "delivery", "summary"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    step === s ? "bg-primary text-primary-foreground" :
                    ["address", "delivery", "summary"].indexOf(step) > i 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {["address", "delivery", "summary"].indexOf(step) > i ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm hidden sm:block",
                    step === s ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {s === "address" ? "Adres" : s === "delivery" ? "Teslimat" : "Özet"}
                  </span>
                  {i < 2 && <div className="w-8 h-0.5 bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Address Step */}
                {step === "address" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Teslimat Adresi</h2>
                    
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map((addr) => (
                        <Card key={addr.id} className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedAddress === addr.id && "border-primary bg-primary/5"
                        )}>
                          <label className="flex gap-3 cursor-pointer">
                            <RadioGroupItem value={addr.id} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-accent" />
                                <span className="font-bold">{addr.title}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{addr.fullAddress}</p>
                              <p className="text-sm text-muted-foreground">{addr.phone}</p>
                              {addr.instructions && (
                                <p className="text-xs text-muted-foreground mt-1">Not: {addr.instructions}</p>
                              )}
                            </div>
                          </label>
                        </Card>
                      ))}
                    </RadioGroup>

                    {showNewAddress ? (
                      <Card className="p-4 space-y-4">
                        <h3 className="font-bold">Yeni Adres Ekle</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Adres Başlığı *</Label>
                            <Input
                              id="title"
                              placeholder="Ev, İş, vb."
                              value={newAddress.title}
                              onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefon *</Label>
                            <Input
                              id="phone"
                              placeholder="0532 123 45 67"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fullAddress">Adres *</Label>
                          <Textarea
                            id="fullAddress"
                            placeholder="Mahalle, sokak, bina no, daire no, ilçe/il"
                            value={newAddress.fullAddress}
                            onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instructions">Teslimat Notu (opsiyonel)</Label>
                          <Input
                            id="instructions"
                            placeholder="Kapıda zil yok, lütfen arayın"
                            value={newAddress.instructions}
                            onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddAddress}>Kaydet</Button>
                          <Button variant="outline" onClick={() => setShowNewAddress(false)}>İptal</Button>
                        </div>
                      </Card>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewAddress(true)}>
                        <Plus className="h-4 w-4" />
                        Yeni Adres Ekle
                      </Button>
                    )}
                  </div>
                )}

                {/* Delivery Step */}
                {step === "delivery" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Teslimat Zamanı</h2>
                    
                    {Object.entries(groupedSlots).map(([date, slots]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{formatDate(date)}</h3>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          {slots.map((slot) => {
                            const isDisabled = !slot.available || slot.isPast;
                            return (
                              <Card
                                key={slot.id}
                                className={cn(
                                  "p-4 cursor-pointer transition-all",
                                  isDisabled && "opacity-50 cursor-not-allowed",
                                  selectedSlot === slot.id && "border-primary bg-primary/5"
                                )}
                                onClick={() => !isDisabled && setSelectedSlot(slot.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{slot.label}</span>
                                </div>
                                {!slot.available && (
                                  <p className="text-xs text-muted-foreground mt-1">Dolu</p>
                                )}
                                {slot.isPast && slot.available && (
                                  <p className="text-xs text-muted-foreground mt-1">Geçmiş</p>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Step */}
                {step === "summary" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Sipariş Özeti</h2>
                    
                    <Card className="p-4">
                      <h3 className="font-bold mb-3">Teslimat Adresi</h3>
                      {addresses.find(a => a.id === selectedAddress) && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {addresses.find(a => a.id === selectedAddress)?.title}
                          </p>
                          <p>{addresses.find(a => a.id === selectedAddress)?.fullAddress}</p>
                          <p>{addresses.find(a => a.id === selectedAddress)?.phone}</p>
                        </div>
                      )}
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-bold mb-3">Teslimat Zamanı</h3>
                      {deliverySlots.find(s => s.id === selectedSlot) && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {formatDate(deliverySlots.find(s => s.id === selectedSlot)!.date)}
                          </p>
                          <p>{deliverySlots.find(s => s.id === selectedSlot)?.label}</p>
                        </div>
                      )}
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-bold mb-3">Ürünler ({items.length})</h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-3">
                            <img
                              src={item.product.images?.[0] || '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x {item.product.price.toFixed(2)}₺
                              </p>
                            </div>
                            <p className="font-medium text-sm">
                              {(item.quantity * item.product.price).toFixed(2)}₺
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="font-bold text-lg mb-4">Sipariş Tutarı</h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ara Toplam</span>
                      <span>{total.toFixed(2)}₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teslimat</span>
                      <span className={deliveryFee === 0 ? "text-stock-plenty" : ""}>
                        {deliveryFee === 0 ? "Ücretsiz" : `${deliveryFee?.toFixed(2)}₺`}
                      </span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Toplam</span>
                      <span>{grandTotal?.toFixed(2)}₺</span>
                    </div>
                  </div>

                  {step === "summary" ? (
                    <Button 
                      className="w-full mt-6 h-12 text-base gap-2"
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          Siparişi Onayla
                          <Check className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full mt-6 h-12 text-base gap-2"
                      onClick={handleContinue}
                    >
                      Devam Et
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}

                  {step !== "address" && (
                    <Button 
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setStep(step === "summary" ? "delivery" : "address")}
                    >
                      Geri
                    </Button>
                  )}
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

export default Checkout;
