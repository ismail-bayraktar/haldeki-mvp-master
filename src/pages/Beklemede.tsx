import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, Home, LogOut, Loader2 } from "lucide-react";
import logotypeDark from "@/assets/logotype_dark.svg";
import { normalizePhoneNumber } from "@/lib/phoneNormalizer";

type ApprovalStatus = "pending" | "approved" | "rejected" | "loading" | "not_applicable";
type ApprovalType = "whitelist" | "dealer" | "supplier";

interface ApprovalInfo {
  status: ApprovalStatus;
  type: ApprovalType | null;
  name: string | null;
  phone: string | null;
}

const Beklemede = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, roles } = useAuth();
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo>({
    status: "loading",
    type: null,
    name: null,
    phone: null,
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async (): Promise<ApprovalInfo> => {
    if (!user) {
      return { status: "not_applicable", type: null, name: null, phone: null };
    }

    try {
      // Get user phone from profiles table (not user_metadata)
      let userPhone: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle();

        userPhone = profile?.phone || null;
      } catch (error) {
        console.error('Error fetching user phone:', error);
      }

      // Check whitelist first
      if (userPhone) {
        // Normalize phone number for consistent matching
        const normalizedPhone = normalizePhoneNumber(userPhone);

        if (normalizedPhone) {
          const { data: whitelistData } = await supabase
            .from("whitelist_applications")
            .select("id, status, full_name, phone")
            .eq("phone", normalizedPhone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (whitelistData) {
            return {
              status: whitelistData.status as ApprovalStatus,
              type: "whitelist",
              name: whitelistData.full_name,
              phone: whitelistData.phone,
            };
          }
        }
      }

      // Check dealer approval
      if (roles.includes("dealer")) {
        const { data: dealerData } = await supabase
          .from("dealers")
          .select("approval_status, name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (dealerData) {
          return {
            status: dealerData.approval_status as ApprovalStatus,
            type: "dealer",
            name: dealerData.name,
            phone: null,
          };
        }
      }

      // Check supplier approval
      if (roles.includes("supplier")) {
        const { data: supplierData } = await supabase
          .from("suppliers")
          .select("approval_status, name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (supplierData) {
          return {
            status: supplierData.approval_status as ApprovalStatus,
            type: "supplier",
            name: supplierData.name,
            phone: null,
          };
        }
      }

      return { status: "not_applicable", type: null, name: null, phone: null };
    } catch (err) {
      console.error("Status check error:", err);
      return { status: "not_applicable", type: null, name: null, phone: null };
    }
  };

  const handleApprovedRedirect = (type: ApprovalType) => {
    // Auto-redirect after 2 seconds
    autoRedirectTimeoutRef.current = setTimeout(() => {
      let redirectPath = "/";
      if (type === "dealer") redirectPath = "/bayi";
      else if (type === "supplier") redirectPath = "/tedarikci";
      else if (type === "whitelist") redirectPath = "/urunler";

      navigate(redirectPath);
    }, 2000);
  };

  useEffect(() => {
    const initialCheck = async () => {
      if (!authLoading && isAuthenticated) {
        const info = await checkStatus();
        setApprovalInfo(info);

        // If approved, start auto-redirect
        if (info.status === "approved" && info.type) {
          handleApprovedRedirect(info.type);
        }

        // If pending, start polling
        if (info.status === "pending") {
          pollingIntervalRef.current = setInterval(async () => {
            const updatedInfo = await checkStatus();
            setApprovalInfo(updatedInfo);

            if (updatedInfo.status === "approved" && updatedInfo.type) {
              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              // Start auto-redirect
              handleApprovedRedirect(updatedInfo.type);
            }
          }, 10000); // Poll every 10 seconds
        }
      }
    };

    initialCheck();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (autoRedirectTimeoutRef.current) {
        clearTimeout(autoRedirectTimeoutRef.current);
      }
    };
  }, [authLoading, isAuthenticated, user, roles]);

  const handleLogout = async () => {
    // Clear intervals before logout
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (autoRedirectTimeoutRef.current) {
      clearTimeout(autoRedirectTimeoutRef.current);
    }
    await logout();
    navigate("/");
  };

  // Auth loading
  if (authLoading || approvalInfo.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated or not applicable
  if (!isAuthenticated || approvalInfo.status === "not_applicable") {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Erişim Yok</CardTitle>
              <CardDescription>
                Bu sayfa sadece onay bekleyen kullanıcılar içindir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate("/")} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Ana Sayfaya Git
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Status content
  const getStatusConfig = (status: ApprovalStatus) => {
    const baseConfig = {
      pending: {
        icon: Clock,
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        title: "Başvurunuz İnceleniyor",
        description: "Başvurunuz inceleniyor. Onaylandığında otomatik olarak yönlendirileceksiniz.",
      },
      approved: {
        icon: CheckCircle,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        title: "Başvurunuz Onaylandı!",
        description: "Tebrikler! Başvurunuz onaylandı. Yönlendiriliyorsunuz...",
      },
      rejected: {
        icon: XCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        title: "Başvurunuz Reddedildi",
        description: "Üzgünüz, başvurunuz onaylanamadı. Detaylar için iletişime geçin.",
      },
    };
    return baseConfig[status];
  };

  const getTypeLabel = (type: ApprovalType | null) => {
    switch (type) {
      case "whitelist": return "Erken Erişim";
      case "dealer": return "Bayi";
      case "supplier": return "Tedarikçi";
      default: return "Bilinmiyor";
    }
  };

  const getRedirectPath = (type: ApprovalType) => {
    switch (type) {
      case "whitelist": return "/urunler";
      case "dealer": return "/bayi";
      case "supplier": return "/tedarikci";
      default: return "/";
    }
  };

  const config = getStatusConfig(approvalInfo.status);
  const Icon = config.icon;
  const typeLabel = getTypeLabel(approvalInfo.type);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logotypeDark} alt="Haldeki" className="h-10 mx-auto mb-4" />
          </div>

          <Card className="border-border/50 shadow-lg text-center">
            <CardHeader>
              <div className={`mx-auto w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`h-10 w-10 ${config.iconColor}`} />
              </div>
              <CardTitle className="text-xl">{config.title}</CardTitle>
              <CardDescription className="mt-2">
                {config.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Başvuru Türü</p>
                <p className="font-semibold">{typeLabel}</p>
                {approvalInfo.name && (
                  <>
                    <p className="text-sm text-muted-foreground mt-3 mb-1">Ad Soyad</p>
                    <p className="font-semibold">{approvalInfo.name}</p>
                  </>
                )}
                {approvalInfo.phone && (
                  <>
                    <p className="text-sm text-muted-foreground mt-3 mb-1">Telefon</p>
                    <p className="font-semibold">{approvalInfo.phone}</p>
                  </>
                )}
              </div>

              {approvalInfo.status === "approved" && approvalInfo.type && (
                <Button
                  onClick={() => navigate(getRedirectPath(approvalInfo.type))}
                  className="w-full"
                >
                  Panele Git
                </Button>
              )}

              <div className="flex gap-2">
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfa
                </Button>
                <Button onClick={handleLogout} variant="outline" className="flex-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </Button>
              </div>

              {approvalInfo.status === "pending" && (
                <p className="text-xs text-muted-foreground">
                  Sorularınız için{" "}
                  <a href="/iletisim" className="text-primary hover:underline">
                    iletişim sayfamızı
                  </a>{" "}
                  ziyaret edebilirsiniz.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Beklemede;

