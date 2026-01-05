import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Phone, Mail, MapPin, AlertCircle, Home, LogOut, Package, TrendingUp, Clock, ShoppingCart } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useBusinessOrders } from "@/hooks/useBusinessOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BusinessOrderList from "@/components/business/BusinessOrderList";
import { Link } from "react-router-dom";

const BusinessDashboard = () => {
  const { user, logout } = useAuth();
  const { business, regions, isLoading, error } = useBusinessProfile();
  const {
    orders,
    isLoading: ordersLoading,
    getOrderStats,
  } = useBusinessOrders();

  const stats = getOrderStats();

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
              <h1 className="text-2xl font-bold text-foreground">İşletme Paneli</h1>
              <p className="text-muted-foreground">
                Hoş geldiniz, {business?.company_name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {business?.is_active ? (
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
        ) : business ? (
          <>
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">
                    adet sipariş
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktif Sipariş</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">
                    işlemde
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bekleyen Teslimat</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    onay bekliyor
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₺{stats.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    teslim edilen siparişler
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Business Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    İşletme Bilgileri
                  </CardTitle>
                  <CardDescription>Firma ve iletişim bilgileriniz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Şirket Adı</label>
                    <p className="text-foreground font-medium">{business.company_name}</p>
                  </div>

                  {business.contact_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Yetkili Kişi</label>
                      <p className="text-foreground">{business.contact_name}</p>
                    </div>
                  )}

                  {business.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{business.contact_phone}</span>
                    </div>
                  )}

                  {business.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{business.contact_email}</span>
                    </div>
                  )}

                  {business.business_type && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">İşletme Türü</label>
                      <p className="text-foreground capitalize">{business.business_type}</p>
                    </div>
                  )}

                  {business.tax_number && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vergi No</label>
                      <p className="text-foreground font-mono text-sm">{business.tax_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Regions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Hizmet Bölgeleri
                  </CardTitle>
                  <CardDescription>Sipariş verebileceğiniz bölgeler</CardDescription>
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

            {/* Orders List */}
            <BusinessOrderList orders={orders} isLoading={ordersLoading} />
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kayıt Bulunamadı</AlertTitle>
            <AlertDescription>
              İşletme kaydınız bulunamadı. Lütfen yöneticinize başvurun.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default BusinessDashboard;
