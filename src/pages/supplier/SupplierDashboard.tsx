import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Truck, 
  Phone, 
  Mail, 
  AlertCircle, 
  Package, 
  Trash2, 
  Home, 
  LogOut, 
  CheckCircle, 
  XCircle,
  ClipboardList,
  Calendar,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { useSupplierProfile } from "@/hooks/useSupplierProfile";
import { useSupplierOffers } from "@/hooks/useSupplierOffers";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SupplierOfferForm from "@/components/supplier/SupplierOfferForm";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Beklemede</Badge>;
    case 'approved':
      return <Badge className="bg-green-600 text-white">Onaylandı</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Reddedildi</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getOrderStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Onay Bekliyor', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Onaylandı', className: 'bg-blue-100 text-blue-800' },
    preparing: { label: 'Hazırlanıyor', className: 'bg-orange-100 text-orange-800' },
  };
  const c = config[status] || { label: status, className: '' };
  return <Badge className={c.className}>{c.label}</Badge>;
};

const SupplierDashboard = () => {
  const { user, logout } = useAuth();
  const { supplier, isLoading, error } = useSupplierProfile();
  const { offers, isLoading: offersLoading, createOffer, deleteOffer } = useSupplierOffers(supplier?.id);
  const { 
    prepList, 
    isLoading: ordersLoading, 
    stats,
  } = useSupplierOrders(supplier?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('prep');

  const handleCreateOffer = async (data: unknown) => {
    setIsSubmitting(true);
    const success = await createOffer(data as Parameters<typeof createOffer>[0]);
    setIsSubmitting(false);
    return success;
  };

  // Son 24 saatte durum değişen teklifler
  const recentStatusChanges = offers.filter(offer => {
    if (offer.status === 'pending') return false;
    const updatedAt = new Date(offer.updated_at);
    const now = new Date();
    const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  });

  const approvedCount = recentStatusChanges.filter(o => o.status === 'approved').length;
  const rejectedCount = recentStatusChanges.filter(o => o.status === 'rejected').length;

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
              <h1 className="text-2xl font-bold text-foreground">Tedarikçi Paneli</h1>
              <p className="text-muted-foreground">
                Hoş geldiniz, {supplier?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {stats.pendingOrders > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  {stats.pendingOrders} sipariş bekliyor
                </Badge>
              )}
              {approvedCount > 0 && (
                <Badge className="bg-green-600 text-white flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {approvedCount} onaylandı
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {rejectedCount} reddedildi
                </Badge>
              )}
              {supplier?.is_active ? (
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
        ) : supplier ? (
          <>
            {/* İstatistik Kartları */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bekleyen Sipariş</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">onay bekliyor</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">aktif sipariş</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ürün Çeşidi</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">hazırlanacak</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Miktar</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQuantity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">kg/adet</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Tedarikçi Bilgileri */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tedarikçi Bilgilerim
                  </CardTitle>
                  <CardDescription>Firma ve iletişim bilgileriniz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Firma Adı</label>
                    <p className="text-foreground font-medium">{supplier.name}</p>
                  </div>
                  
                  {supplier.contact_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Yetkili Kişi</label>
                      <p className="text-foreground">{supplier.contact_name}</p>
                    </div>
                  )}

                  {supplier.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.contact_phone}</span>
                    </div>
                  )}

                  {supplier.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.contact_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Teklif Formu */}
              <SupplierOfferForm 
                supplierId={supplier.id} 
                onSubmit={handleCreateOffer}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Tabs: Hazırlanacaklar ve Teklifler */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="prep" className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  Hazırlanacaklar ({prepList.length})
                </TabsTrigger>
                <TabsTrigger value="offers" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Tekliflerim ({offers.length})
                </TabsTrigger>
              </TabsList>

              {/* Hazırlanacaklar Tab */}
              <TabsContent value="prep">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Bugün Hazırlanacaklar
                    </CardTitle>
                    <CardDescription>
                      Ürünlerinizi içeren aktif siparişler
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : prepList.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Şu an hazırlanacak sipariş bulunmuyor</p>
                        <p className="text-sm mt-2">
                          Ürünleriniz siparişe eklendiğinde burada görünecek
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {prepList.map((item) => (
                          <AccordionItem key={item.productId} value={item.productId}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-4 flex-1 text-left">
                                <div className="flex-1">
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.orderCount} sipariş
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">
                                    {item.totalQuantity.toFixed(1)} {item.unit}
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {item.orders.map((order, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                                  >
                                    <div>
                                      <p className="font-mono text-sm">
                                        #{order.orderId.slice(0, 8)}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {order.regionName}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">
                                        {order.quantity} {item.unit}
                                      </span>
                                      {getOrderStatusBadge(order.status)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Teklifler Tab */}
              <TabsContent value="offers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Tekliflerim
                    </CardTitle>
                    <CardDescription>Ürün fiyat ve miktar teklifleriniz</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {offersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : offers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Henüz teklif oluşturmadınız</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ürün</TableHead>
                            <TableHead>Teklif Fiyatı</TableHead>
                            <TableHead>Miktar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {offers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium">
                                {offer.product?.name || 'Bilinmeyen Ürün'}
                              </TableCell>
                              <TableCell>
                                {offer.offered_price.toFixed(2)} ₺/{offer.unit}
                              </TableCell>
                              <TableCell>
                                {offer.offered_quantity} {offer.unit}
                              </TableCell>
                              <TableCell>{getStatusBadge(offer.status)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(offer.created_at), 'dd MMM yyyy', { locale: tr })}
                              </TableCell>
                              <TableCell>
                                {offer.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteOffer(offer.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kayıt Bulunamadı</AlertTitle>
            <AlertDescription>
              Tedarikçi kaydınız bulunamadı. Lütfen yöneticinize başvurun.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default SupplierDashboard;
