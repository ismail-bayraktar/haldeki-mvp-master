import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Phone, Mail, MapPin, AlertCircle, Home, LogOut, Bell } from "lucide-react";
import { useDealerProfile } from "@/hooks/useDealerProfile";
import { useDealerOrders } from "@/hooks/useDealerOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DealerOrderList from "@/components/dealer/DealerOrderList";
import { Link } from "react-router-dom";

const DealerDashboard = () => {
  const { user, logout } = useAuth();
  const { dealer, regions, isLoading, error } = useDealerProfile();
  const regionIds = dealer?.region_ids || [];
  const { orders, isLoading: ordersLoading } = useDealerOrders(regionIds);

  // Son 24 saatte oluşan yeni siparişler
  const newOrdersCount = orders.filter(order => {
    const createdAt = new Date(order.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bayi Paneli</h1>
              <p className="text-muted-foreground">
                Hoş geldiniz, {dealer?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {newOrdersCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {newOrdersCount} yeni sipariş
                </Badge>
              )}
              {dealer?.is_active ? (
                <Badge variant="default" className="bg-green-600">Aktif</Badge>
              ) : (
                <Badge variant="destructive">Pasif</Badge>
              )}
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Siteye Git
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : dealer ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bayi Bilgileri */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Bayi Bilgilerim
                  </CardTitle>
                  <CardDescription>Firma ve iletişim bilgileriniz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Firma Adı</label>
                    <p className="text-foreground font-medium">{dealer.name}</p>
                  </div>
                  
                  {dealer.contact_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Yetkili Kişi</label>
                      <p className="text-foreground">{dealer.contact_name}</p>
                    </div>
                  )}

                  {dealer.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{dealer.contact_phone}</span>
                    </div>
                  )}

                  {dealer.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{dealer.contact_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atanan Bölgeler */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Atanan Bölgeler
                  </CardTitle>
                  <CardDescription>Teslimat sorumluluğunuzdaki bölgeler</CardDescription>
                </CardHeader>
                <CardContent>
                  {regions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {regions.map(region => (
                        <Badge key={region.id} variant="secondary">
                          {region.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Henüz bölge atanmamış</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bölge Siparişleri */}
            <DealerOrderList orders={orders} isLoading={ordersLoading} />
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kayıt Bulunamadı</AlertTitle>
            <AlertDescription>
              Bayi kaydınız bulunamadı. Lütfen yöneticinize başvurun.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default DealerDashboard;
