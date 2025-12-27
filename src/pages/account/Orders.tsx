import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, ChevronLeft, ShoppingBag, Clock, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface ShippingAddress {
  title?: string;
  fullAddress: string;
  phone: string;
  instructions?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  notes: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  estimated_delivery_time: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
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
  return config[status] || { label: status, className: '', icon: Package };
};

const OrderTimeline = ({ order }: { order: Order }) => {
  const steps = [
    { status: 'pending', label: 'Sipariş Alındı', time: order.created_at },
    { status: 'confirmed', label: 'Onaylandı', time: null },
    { status: 'preparing', label: 'Hazırlanıyor', time: null },
    { status: 'shipped', label: 'Yola Çıktı', time: null },
    { status: 'delivered', label: 'Teslim Edildi', time: order.delivered_at },
  ];

  const statusOrder = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);

  if (order.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 font-medium">
          <XCircle className="h-5 w-5" />
          Sipariş İptal Edildi
        </div>
        {order.cancellation_reason && (
          <p className="text-sm text-red-600 mt-2">
            Sebep: {order.cancellation_reason}
          </p>
        )}
        {order.cancelled_at && (
          <p className="text-xs text-red-500 mt-1">
            {format(new Date(order.cancelled_at), 'dd MMM yyyy HH:mm', { locale: tr })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step.status} className="flex items-start gap-3">
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              ${isCompleted 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'}
              ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}
            `}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.time && isCompleted && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(step.time), 'dd MMM yyyy HH:mm', { locale: tr })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AccountOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedOrders: Order[] = (data || []).map(order => ({
          ...order,
          items: Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [],
          shipping_address: order.shipping_address as ShippingAddress | null,
        }));

        setOrders(mappedOrders);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
        toast.error('Siparişler yüklenirken hata oluştu: ' + message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/hesabim">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Hesabım
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
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
              <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <AccordionItem key={order.id} value={order.id}>
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
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₺{order.total_amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{order.items.length} ürün</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {/* Ürünler */}
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

                          {/* Teslimat Adresi */}
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
                              </div>
                            </div>
                          )}

                          {/* Tahmini Teslimat */}
                          {order.estimated_delivery_time && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tahmini Teslimat:</span>
                              <span className="font-medium">
                                {format(new Date(order.estimated_delivery_time), 'dd MMM HH:mm', { locale: tr })}
                              </span>
                            </div>
                          )}

                          {/* Detay Butonu */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Sipariş Takibi
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* Sipariş Takip Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sipariş Takibi</DialogTitle>
            <DialogDescription>
              Sipariş No: #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <OrderTimeline order={selectedOrder} />
              
              {selectedOrder.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-1">Sipariş Notunuz</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountOrders;

