import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Header, Footer, MobileNav } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, User, Building2, Phone, Package, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import logotypeDark from "@/assets/logotype_dark.svg";

interface InviteData {
  id: string;
  email: string;
  supplier_data: {
    name: string;
    contact_name?: string;
    contact_phone?: string;
  } | null;
  expires_at: string;
}

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "used";

const PRODUCT_CATEGORIES = [
  { id: "sebze", label: "Sebze" },
  { id: "meyve", label: "Meyve" },
  { id: "yesil", label: "Yeşillik" },
  { id: "organik", label: "Organik Ürünler" },
  { id: "kuruyemis", label: "Kuruyemiş" },
  { id: "diger", label: "Diğer" },
];

const TedarikciKayit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("loading");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    passwordConfirm: "",
    firmName: "",
    contactPhone: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Token doğrulama
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setInviteStatus("invalid");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pending_invites")
          .select("id, email, supplier_data, expires_at, used_at, role")
          .eq("id", token)
          .eq("role", "supplier")
          .single();

        if (error || !data) {
          setInviteStatus("invalid");
          return;
        }

        // Kullanılmış mı kontrol et
        if (data.used_at) {
          setInviteStatus("used");
          return;
        }

        // Süresi dolmuş mu kontrol et
        if (new Date(data.expires_at) < new Date()) {
          setInviteStatus("expired");
          return;
        }

        setInviteData({
          id: data.id,
          email: data.email,
          supplier_data: data.supplier_data as InviteData["supplier_data"],
          expires_at: data.expires_at,
        });

        // Pre-fill form with invite data
        if (data.supplier_data) {
          const supplierData = data.supplier_data as InviteData["supplier_data"];
          setFormData(prev => ({
            ...prev,
            fullName: supplierData?.contact_name || "",
            firmName: supplierData?.name || "",
            contactPhone: supplierData?.contact_phone || "",
          }));
        }

        setInviteStatus("valid");
      } catch (err) {
        console.error("Token validation error:", err);
        setInviteStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteData) return;

    if (formData.password !== formData.passwordConfirm) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (!formData.firmName.trim()) {
      toast.error("Firma adı zorunludur");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("En az bir ürün kategorisi seçmelisiniz");
      return;
    }

    setIsSubmitting(true);

    try {
      // Önce pending_invites'i güncelle (ek bilgiler için)
      const updatedSupplierData = {
        ...inviteData.supplier_data,
        name: formData.firmName,
        contact_name: formData.fullName,
        contact_phone: formData.contactPhone,
        product_categories: selectedCategories,
      };

      const { error: updateError } = await supabase
        .from("pending_invites")
        .update({ supplier_data: updatedSupplierData })
        .eq("id", inviteData.id);

      if (updateError) {
        console.error("Update invite error:", updateError);
        // Devam et, kritik değil
      }

      // Supabase Auth ile kayıt ol
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/beklemede`,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signupError) {
        if (signupError.message.includes("User already registered")) {
          toast.error("Bu email adresi zaten kayıtlı. Lütfen giriş yapın.");
        } else {
          toast.error(signupError.message);
        }
        return;
      }

      // Suppliers tablosuna kayıt ekle (pending status ile)
      if (signupData.user) {
        const { error: supplierError } = await supabase
          .from("suppliers")
          .insert({
            id: signupData.user.id,
            user_id: signupData.user.id,
            name: formData.firmName,
            contact_name: formData.fullName,
            contact_phone: formData.contactPhone,
            contact_email: inviteData.email,
            product_categories: selectedCategories,
            approval_status: "pending",
            is_active: false,
          });

        if (supplierError) {
          console.error("Supplier insert error:", supplierError);
          // Kritik değil, devam et
        }

        // user_roles tablosuna supplier rolü ekle
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signupData.user.id,
            role: "supplier",
          });

        if (roleError) {
          console.error("Role insert error:", roleError);
        }

        // pending_invites'i kullanıldı olarak işaretle
        await supabase
          .from("pending_invites")
          .update({ used_at: new Date().toISOString() })
          .eq("id", inviteData.id);
      }

      setIsSuccess(true);
      toast.success("Kayıt başarılı! Başvurunuz incelemeye alındı.");

      // 3 saniye sonra beklemede sayfasına yönlendir
      setTimeout(() => {
        navigate("/beklemede");
      }, 3000);
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Kayıt sırasında bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid/Expired/Used states
  if (inviteStatus !== "valid") {
    const messages = {
      invalid: {
        title: "Geçersiz Davet",
        description: "Bu davet linki geçersiz veya bulunamadı.",
        icon: AlertCircle,
      },
      expired: {
        title: "Davet Süresi Dolmuş",
        description: "Bu davet linkinin süresi dolmuş. Lütfen yeni bir davet talep edin.",
        icon: AlertCircle,
      },
      used: {
        title: "Davet Kullanılmış",
        description: "Bu davet linki daha önce kullanılmış. Zaten kayıtlıysanız giriş yapabilirsiniz.",
        icon: CheckCircle,
      },
    };

    const msg = messages[inviteStatus as keyof typeof messages];
    const Icon = msg.icon;

    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>{msg.title}</CardTitle>
              <CardDescription>{msg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/giris")} variant="outline" className="w-full">
                Giriş Sayfasına Git
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Başvurunuz Alındı!</CardTitle>
              <CardDescription>
                Tedarikçi başvurunuz incelemeye alındı. Onay durumu hakkında email ile bilgilendirileceksiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Yönlendiriliyorsunuz...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logotypeDark} alt="Haldeki" className="h-10 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Tedarikçi Kayıt</h1>
            <p className="text-muted-foreground">
              Haldeki tedarikçi ağına katılmak için bilgilerinizi doldurun
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-fresh-orange" />
                Tedarikçi Bilgileri
              </CardTitle>
              <CardDescription>
                Davet: <span className="font-medium">{inviteData?.email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={inviteData?.email || ""}
                      className="pl-10 bg-muted"
                      disabled
                    />
                  </div>
                </div>

                {/* Şifre */}
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={formData.password}
                      onChange={handleInputChange("password")}
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Şifre Tekrar */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Şifre Tekrar *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange("passwordConfirm")}
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                  {formData.password && formData.passwordConfirm &&
                   formData.password !== formData.passwordConfirm && (
                    <p className="text-xs text-destructive">Şifreler eşleşmiyor</p>
                  )}
                </div>

                <div className="h-px bg-border my-4" />

                {/* Yetkili Adı */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Yetkili Ad Soyad *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={formData.fullName}
                      onChange={handleInputChange("fullName")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Firma Adı */}
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firma Adı *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firmName"
                      type="text"
                      placeholder="Firma Ünvanı"
                      value={formData.firmName}
                      onChange={handleInputChange("firmName")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Telefon */}
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefon *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="0532 123 45 67"
                      value={formData.contactPhone}
                      onChange={handleInputChange("contactPhone")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Ürün Kategorileri */}
                <div className="space-y-3">
                  <Label>Ürün Kategorileri *</Label>
                  <p className="text-xs text-muted-foreground">
                    Tedarik edeceğiniz ürün kategorilerini seçin
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PRODUCT_CATEGORIES.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <label
                          htmlFor={category.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-fresh-orange hover:bg-fresh-orange/90"
                  disabled={isSubmitting || formData.password !== formData.passwordConfirm}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kayıt yapılıyor...
                    </>
                  ) : (
                    "Başvuruyu Tamamla"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Kayıt olarak{" "}
                  <a href="#" className="text-primary hover:underline">
                    Kullanım Şartları
                  </a>{" "}
                  ve{" "}
                  <a href="#" className="text-primary hover:underline">
                    Gizlilik Politikası
                  </a>
                  'nı kabul etmiş olursunuz.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default TedarikciKayit;

