import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, Home, LogOut, Loader2 } from "lucide-react";
import logotypeDark from "@/assets/logotype_dark.svg";

type ApprovalStatus = "pending" | "approved" | "rejected" | "loading" | "not_applicable";

interface ApprovalInfo {
  status: ApprovalStatus;
  role: "dealer" | "supplier" | null;
  name: string | null;
}

const Beklemede = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, isDealer, isSupplier } = useAuth();
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo>({
    status: "loading",
    role: null,
    name: null,
  });

  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!user) {
        setApprovalInfo({ status: "not_applicable", role: null, name: null });
        return;
      }

      try {
        // Bayi kontrolü
        if (isDealer) {
          const { data: dealerData } = await supabase
            .from("dealers")
            .select("approval_status, name")
            .eq("user_id", user.id)
            .single();

          if (dealerData) {
            setApprovalInfo({
              status: dealerData.approval_status as ApprovalStatus,
              role: "dealer",
              name: dealerData.name,
            });

            // Onaylanmışsa dashboard'a yönlendir
            if (dealerData.approval_status === "approved") {
              navigate("/bayi");
            }
            return;
          }
        }

        // Tedarikçi kontrolü
        if (isSupplier) {
          const { data: supplierData } = await supabase
            .from("suppliers")
            .select("approval_status, name")
            .eq("user_id", user.id)
            .single();

          if (supplierData) {
            setApprovalInfo({
              status: supplierData.approval_status as ApprovalStatus,
              role: "supplier",
              name: supplierData.name,
            });

            // Onaylanmışsa dashboard'a yönlendir
            if (supplierData.approval_status === "approved") {
              navigate("/tedarikci");
            }
            return;
          }
        }

        // Normal kullanıcı - ana sayfaya yönlendir
        setApprovalInfo({ status: "not_applicable", role: null, name: null });
      } catch (err) {
        console.error("Approval check error:", err);
        setApprovalInfo({ status: "not_applicable", role: null, name: null });
      }
    };

    if (!authLoading && isAuthenticated) {
      checkApprovalStatus();
    }
  }, [user, authLoading, isAuthenticated, isDealer, isSupplier, navigate]);

  const handleLogout = async () => {
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
                Bu sayfa sadece onay bekleyen bayi ve tedarikçiler içindir.
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
  const statusConfig = {
    pending: {
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: "Başvurunuz İnceleniyor",
      description: "Başvurunuz admin ekibimiz tarafından incelenmektedir. Onay durumu hakkında email ile bilgilendirileceksiniz.",
    },
    approved: {
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "Başvurunuz Onaylandı!",
      description: "Tebrikler! Başvurunuz onaylandı. Panele erişebilirsiniz.",
    },
    rejected: {
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "Başvurunuz Reddedildi",
      description: "Üzgünüz, başvurunuz şu anda onaylanamadı. Detaylar için bizimle iletişime geçebilirsiniz.",
    },
  };

  const config = statusConfig[approvalInfo.status as keyof typeof statusConfig];
  const Icon = config?.icon || Clock;
  const roleLabel = approvalInfo.role === "dealer" ? "Bayi" : "Tedarikçi";

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
              <div className={`mx-auto w-20 h-20 rounded-full ${config?.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`h-10 w-10 ${config?.iconColor}`} />
              </div>
              <CardTitle className="text-xl">{config?.title}</CardTitle>
              <CardDescription className="mt-2">
                {config?.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Başvuru Türü</p>
                <p className="font-semibold">{roleLabel}</p>
                {approvalInfo.name && (
                  <>
                    <p className="text-sm text-muted-foreground mt-3 mb-1">Firma</p>
                    <p className="font-semibold">{approvalInfo.name}</p>
                  </>
                )}
              </div>

              {approvalInfo.status === "approved" && (
                <Button
                  onClick={() => navigate(approvalInfo.role === "dealer" ? "/bayi" : "/tedarikci")}
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

