import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Building2, Calendar, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCreatePaymentNotification, usePaymentNotificationByOrder } from "@/hooks/usePaymentNotifications";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const PaymentNotification = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const createNotification = useCreatePaymentNotification();
  const { data: existingNotification } = usePaymentNotificationByOrder(orderId || "");

  // Sipariş bilgilerini getir
  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const [formData, setFormData] = useState({
    bank_name: "",
    account_holder: "",
    amount: order?.total_amount || 0,
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (order?.total_amount) {
      setFormData((prev) => ({ ...prev, amount: order.total_amount }));
    }
  }, [order]);

  // Zaten bildirim varsa göster
  if (existingNotification) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">
          <section className="py-8">
            <div className="container max-w-2xl">
              <Link to="/hesabim/siparisler" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Siparişlerime Dön
              </Link>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle>Bildirim Zaten Gönderilmiş</CardTitle>
                  </div>
                  <CardDescription>
                    Bu sipariş için ödeme bildirimi daha önce gönderilmiş
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className={`font-medium ${
                        existingNotification.status === "verified" ? "text-green-600" :
                        existingNotification.status === "rejected" ? "text-red-600" :
                        "text-yellow-600"
                      }`}>
                        {existingNotification.status === "verified" ? "Doğrulandı" :
                         existingNotification.status === "rejected" ? "Reddedildi" :
                         "Beklemede"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Banka</Label>
                      <p className="text-sm text-muted-foreground">{existingNotification.bank_name}</p>
                    </div>
                    <div>
                      <Label>Hesap Sahibi</Label>
                      <p className="text-sm text-muted-foreground">{existingNotification.account_holder}</p>
                    </div>
                    <div>
                      <Label>Tutar</Label>
                      <p className="text-sm text-muted-foreground">{existingNotification.amount.toFixed(2)}₺</p>
                    </div>
                    <div>
                      <Label>İşlem Tarihi</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(existingNotification.transaction_date).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>

                  {existingNotification.notes && (
                    <div>
                      <Label>Notlar</Label>
                      <p className="text-sm text-muted-foreground">{existingNotification.notes}</p>
                    </div>
                  )}

                  {existingNotification.receipt_url && (
                    <div>
                      <Label>Dekont</Label>
                      <a
                        href={existingNotification.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Dekontu Görüntüle
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/giris");
    return null;
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">
          <section className="py-8">
            <div className="container max-w-2xl">
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Sipariş bulunamadı</p>
                  <Button asChild className="mt-4">
                    <Link to="/hesabim/siparisler">Siparişlerime Dön</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyon
    if (!formData.bank_name || !formData.account_holder || !formData.transaction_date) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    if (formData.amount !== order.total_amount) {
      toast.error(`Tutar sipariş tutarına eşit olmalıdır (${order.total_amount.toFixed(2)}₺)`);
      return;
    }

    const transactionDate = new Date(formData.transaction_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (transactionDate > today) {
      toast.error("İşlem tarihi bugünden sonra olamaz");
      return;
    }

    setIsUploading(true);
    let receiptUrl: string | null = null;

    try {
      // Dekont yükleme (varsa)
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${orderId}-${Date.now()}.${fileExt}`;
        const filePath = `payment-receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Dekont yüklenirken hata oluştu");
          setIsUploading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);

        receiptUrl = urlData.publicUrl;
      }

      // Bildirim oluştur
      await createNotification.mutateAsync({
        order_id: orderId,
        bank_name: formData.bank_name,
        account_holder: formData.account_holder,
        amount: formData.amount,
        transaction_date: formData.transaction_date,
        receipt_url: receiptUrl,
        notes: formData.notes || null,
      });

      navigate("/hesabim/siparisler");
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8">
          <div className="container max-w-2xl">
            <Link to="/hesabim/siparisler" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Siparişlerime Dön
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>EFT/Havale Bildirimi</CardTitle>
                <CardDescription>
                  Sipariş No: {orderId?.slice(0, 8)} | Tutar: {order.total_amount.toFixed(2)}₺
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">
                        Banka Adı <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="Örn: Ziraat Bankası"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_holder">
                        Hesap Sahibi <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="account_holder"
                        value={formData.account_holder}
                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                        placeholder="Ad Soyad veya Firma Adı"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Tutar <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        required
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Sipariş tutarı: {order.total_amount.toFixed(2)}₺
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transaction_date">
                        İşlem Tarihi <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">
                      Dekont (Opsiyonel)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {receiptFile && (
                        <span className="text-sm text-muted-foreground">
                          {receiptFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maksimum dosya boyutu: 5MB (JPG, PNG, PDF)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ek bilgiler, referans numarası vb."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={isUploading || createNotification.isPending}
                      className="flex-1"
                    >
                      {isUploading || createNotification.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Bildirimi Gönder
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/hesabim/siparisler")}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default PaymentNotification;

