import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header, Footer, MobileNav } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, User, Building2, Phone, FileText, AlertCircle, CheckCircle, Store } from "lucide-react";
import { toast } from "sonner";
import logotypeDark from "@/assets/logotype_dark.svg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InviteData {
  id: string;
  email: string;
  business_data: {
    name: string;
    contact_name?: string;
    contact_phone?: string;
    region_ids?: string[];
    business_type?: string;
  } | null;
  expires_at: string;
}

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "used";

const BusinessRegistration = () => {
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
    companyName: "",
    contactPhone: "",
    taxNumber: "",
    taxOffice: "",
    businessType: "restaurant",
  });

  // Token validation
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setInviteStatus("invalid");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pending_invites")
          .select("id, email, business_data, dealer_data, expires_at, used_at, role")
          .eq("id", token)
          .eq("role", "business")
          .single();

        if (error || !data) {
          setInviteStatus("invalid");
          return;
        }

        if (data.used_at) {
          setInviteStatus("used");
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setInviteStatus("expired");
          return;
        }

        // Handle both new business_data and legacy dealer_data
        const bData = (data.business_data || data.dealer_data) as InviteData["business_data"];

        setInviteData({
          id: data.id,
          email: data.email,
          business_data: bData,
          expires_at: data.expires_at,
        });

        // Pre-fill form
        if (bData) {
          setFormData(prev => ({
            ...prev,
            fullName: bData.contact_name || "",
            companyName: bData.name || "",
            contactPhone: bData.contact_phone || "",
            businessType: bData.business_type || "restaurant",
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

    setIsSubmitting(true);

    try {
      // 1. Sign up with Supabase Auth
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

      if (signupData.user) {
        // 2. Add to businesses table
        const { error: businessError } = await supabase
          .from("businesses")
          .insert({
            id: signupData.user.id,
            user_id: signupData.user.id,
            company_name: formData.companyName,
            contact_name: formData.fullName,
            contact_phone: formData.contactPhone,
            contact_email: inviteData.email,
            business_type: formData.businessType,
            tax_number: formData.taxNumber || null,
            tax_office: formData.taxOffice || null,
            region_ids: inviteData.business_data?.region_ids || [],
            approval_status: "pending",
            is_active: false,
          });

        if (businessError) console.error("Business insert error:", businessError);

        // 3. Assign business role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signupData.user.id,
            role: "business",
          });

        if (roleError) console.error("Role insert error:", roleError);

        // 4. Mark invite as used
        await supabase
          .from("pending_invites")
          .update({ used_at: new Date().toISOString() })
          .eq("id", inviteData.id);
      }

      setIsSuccess(true);
      toast.success("Kayıt başarılı! İşletme başvurunuz incelemeye alındı.");
      
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

  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inviteStatus !== "valid") {
    const messages = {
      invalid: { title: "Geçersiz Davet", description: "Bu davet linki geçersiz veya bulunamadı.", icon: AlertCircle },
      expired: { title: "Davet Süresi Dolmuş", description: "Bu davet linkinin süresi dolmuş.", icon: AlertCircle },
      used: { title: "Davet Kullanılmış", description: "Bu davet linki daha önce kullanılmış.", icon: CheckCircle },
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
              <Button onClick={() => navigate("/giris")} variant="outline" className="w-full">Giriş Sayfasına Git</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

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
              <CardDescription>İşletme hesabınız incelemeye alındı. Onaylandığında bilgilendirileceksiniz.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Yönlendiriliyorsunuz...</p>
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <img src={logotypeDark} alt="Haldeki" className="h-10 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">İşletme Kayıt (B2B)</h1>
            <p className="text-muted-foreground">İşletmenize özel avantajlı fiyatlardan yararlanmak için formu doldurun</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Kurumsal Bilgiler
              </CardTitle>
              <CardDescription>Davet Edilen: <span className="font-medium">{inviteData?.email}</span></CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">İşletme/Firma Adı *</Label>
                    <Input id="companyName" value={formData.companyName} onChange={handleInputChange("companyName")} placeholder="Firma Ünvanı" required />
                  </div>
                  <div className="space-y-2">
                    <Label>İşletme Türü</Label>
                    <Select value={formData.businessType} onValueChange={(v) => setFormData({...formData, businessType: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restoran</SelectItem>
                        <SelectItem value="cafe">Kafe</SelectItem>
                        <SelectItem value="hotel">Otel</SelectItem>
                        <SelectItem value="catering">Yemek Firması</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Numarası</Label>
                    <Input id="taxNumber" value={formData.taxNumber} onChange={handleInputChange("taxNumber")} placeholder="V.N." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input id="taxOffice" value={formData.taxOffice} onChange={handleInputChange("taxOffice")} placeholder="V.D." />
                  </div>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Yetkili Ad Soyad *</Label>
                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange("fullName")} placeholder="Adınız Soyadınız" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">İletişim Telefonu *</Label>
                    <Input id="contactPhone" type="tel" value={formData.contactPhone} onChange={handleInputChange("contactPhone")} placeholder="05XX" required />
                  </div>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre Belirleyin *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="En az 6 karakter" value={formData.password} onChange={handleInputChange("password")} className="pl-10" minLength={6} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Şifre Tekrar *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="passwordConfirm" type="password" placeholder="Şifrenizi tekrar girin" value={formData.passwordConfirm} onChange={handleInputChange("passwordConfirm")} className="pl-10" required />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6" disabled={isSubmitting || formData.password !== formData.passwordConfirm}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kayıt yapılıyor...</> : "İşletme Başvurusunu Tamamla"}
                </Button>
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

export default BusinessRegistration;
