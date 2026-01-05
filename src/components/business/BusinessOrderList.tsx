import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, ShoppingCart, Clock, CheckCircle, Truck, MapPin, CreditCard, Building2, ExternalLink, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { BusinessOrder } from '@/hooks/useBusinessOrders';
import { usePaymentNotificationByOrder } from '@/hooks/usePaymentNotifications';
import { RepeatOrderButton } from '@/components/business/RepeatOrderButton';

interface BusinessOrderListProps {
  orders: BusinessOrder[];
  isLoading: boolean;
}

const getStatusConfig = (status: string) => {
  const config: Record<string, { label: string; className: string; icon: typeof Package }> = {
    pending: { label: 'Onay Bekliyor', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Onaylandı', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    preparing: { label: 'Hazırlanıyor', className: 'bg-orange-100 text-orange-800', icon: Package },
    shipped: { label: 'Yolda', className: 'bg-purple-100 text-purple-800', icon: Truck },
    delivered: { label: 'Teslim Edildi', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'İptal Edildi', className: 'bg-red-100 text-red-800', icon: XCircle },
  };
  return config[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Package };
};

const PaymentNotificationButton = ({ orderId }: { orderId: string }) => {
  const { data: notification } = usePaymentNotificationByOrder(orderId);

  if (notification) {
    return (
      <div className="ml-6 mt-2">
        <Badge variant={notification.status === "verified" ? "default" : notification.status === "rejected" ? "destructive" : "secondary"}>
          {notification.status === "verified" ? "Doğrulandı" : notification.status === "rejected" ? "Reddedildi" : "Beklemede"}
        </Badge>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-6 mt-2"
      asChild
    >
      <Link to={`/odeme-bildirimi/${orderId}`}>
        <ExternalLink className="h-3 w-3 mr-1" />
        Havale Bildirimi Yap
      </Link>
    </Button>
  );
};

const BusinessOrderList = ({ orders, isLoading }: BusinessOrderListProps) => {
  // Filter orders by status
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const OrderItem = ({ order }: { order: BusinessOrder }) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const getPaymentMethodLabel = (method: string | null) => {
      switch (method) {
        case 'cash': return 'Kapıda Ödeme - Nakit';
        case 'card': return 'Kapıda Ödeme - Kart';
        case 'eft': return 'EFT/Havale';
        default: return method || '-';
      }
    };

    return (
      <AccordionItem value={order.id}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-4 flex-1 text-left">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </span>
                <Badge className={statusConfig.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
              </p>
              {order.region_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {order.region_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium">₺{order.total_amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{order.items.length} ürün</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {/* Products */}
            <div>
              <h4 className="text-sm font-medium mb-2">Ürünler</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground ml-2">
                        x{item.quantity} {item.unit}
                      </span>
                    </div>
                    <span>₺{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Toplam</span>
                  <span>₺{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Teslimat Adresi
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  {order.shipping_address.title && (
                    <p className="font-medium">{order.shipping_address.title}</p>
                  )}
                  <p>{order.shipping_address.fullAddress}</p>
                  <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                  {order.shipping_address.instructions && (
                    <p className="text-muted-foreground text-xs mt-2">
                      Not: {order.shipping_address.instructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Ödeme Bilgileri
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                {order.payment_status && (
                  <div className="ml-6">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status === "paid" ? "Ödendi" : order.payment_status === "partial" ? "Kısmi Ödendi" : "Ödenmedi"}
                    </Badge>
                  </div>
                )}
                {order.payment_method === 'eft' && <PaymentNotificationButton orderId={order.id} />}
              </div>
            </div>

            {/* Estimated Delivery */}
            {order.estimated_delivery_time && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tahmini Teslimat:</span>
                <span className="font-medium">
                  {format(new Date(order.estimated_delivery_time), 'dd MMM HH:mm', { locale: tr })}
                </span>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-1">Sipariş Notunuz</h4>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {/* Repeat Order Button - Only for delivered orders */}
            {order.status === 'delivered' && (
              <div className="flex justify-end pt-2">
                <RepeatOrderButton
                  orderId={order.id}
                  orderItems={order.items}
                  orderDate={order.created_at}
                  variant="business"
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Siparişlerim
        </CardTitle>
        <CardDescription>Sipariş geçmişinizi görüntüleyin ve takip edin</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Henüz siparişiniz yok</h3>
            <p className="text-muted-foreground mb-4">
              İlk siparişinizi vermek için ürünlerimize göz atın
            </p>
            <Link to="/urunler">
              <Button>Ürünlere Göz At</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Aktif ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Tamamlanan ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                İptal ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Aktif siparişiniz yok</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {activeOrders.map(order => <OrderItem key={order.id} order={order} />)}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Tamamlanan siparişiniz yok</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {completedOrders.map(order => <OrderItem key={order.id} order={order} />)}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {cancelledOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">İptal edilen siparişiniz yok</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {cancelledOrders.map(order => <OrderItem key={order.id} order={order} />)}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessOrderList;
