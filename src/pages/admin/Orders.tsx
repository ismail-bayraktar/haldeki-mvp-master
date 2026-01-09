import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
interface OrderItem {
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    unit: string;
  };
  selectedVariant?: {
    label: string;
    priceMultiplier: number;
  };
}

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  address?: string;
  district?: string;
  city?: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  shipping_address: ShippingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const orderStatuses = [
  { value: "pending", label: "Beklemede", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "confirmed", label: "Onaylandı", icon: CheckCircle, color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "preparing", label: "Hazırlanıyor", icon: ChefHat, color: "bg-purple-100 text-purple-800 border-purple-300" },
  { value: "shipped", label: "Kargoda", icon: Truck, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { value: "delivered", label: "Teslim Edildi", icon: Package, color: "bg-green-100 text-green-800 border-green-300" },
  { value: "cancelled", label: "İptal", icon: XCircle, color: "bg-red-100 text-red-800 border-red-300" },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
      setFilteredOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Siparişler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      const statusInfo = orderStatuses.find(s => s.value === newStatus);
      toast.success(`Sipariş durumu "${statusInfo?.label}" olarak güncellendi`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Güncelleme başarısız');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = orderStatuses.find(s => s.value === status);
    if (!statusInfo) return <Badge variant="secondary">{status}</Badge>;
    
    const Icon = statusInfo.icon;
    return (
      <Badge className={`${statusInfo.color} border gap-1`}>
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getNextStatuses = (currentStatus: string) => {
    const currentIndex = orderStatuses.findIndex(s => s.value === currentStatus);
    if (currentStatus === "cancelled" || currentStatus === "delivered") {
      return orderStatuses;
    }
    return orderStatuses;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
            <p className="text-muted-foreground">Tüm siparişleri görüntüleyin ve yönetin</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {orderStatuses.map((status) => {
          const count = orders.filter(o => o.status === status.value).length;
          const Icon = status.icon;
          return (
            <Card 
              key={status.value} 
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === status.value ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{status.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sipariş ID ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {orderStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredOrders.length} sipariş {statusFilter !== "all" && `(${orderStatuses.find(s => s.value === statusFilter)?.label} filtreli)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {orders.length === 0 ? "Henüz sipariş yok" : "Filtreye uygun sipariş bulunamadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sipariş ID</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ürünler</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Durum Değiştir</TableHead>
                    <TableHead>Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.items?.length || 0} ürün
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(order.total_amount).toFixed(2)}₺
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={isUpdating === order.id}
                        >
                          <SelectTrigger className="w-36">
                            {isUpdating === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {getNextStatuses(order.status).map(status => {
                              const Icon = status.icon;
                              return (
                                <SelectItem key={status.value} value={status.value}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {status.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı</DialogTitle>
            <DialogDescription>
              Sipariş ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-xl font-bold">{Number(selectedOrder.total_amount).toFixed(2)}₺</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Sipariş Ürünleri</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.product?.name || 'Ürün'}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {item.selectedVariant?.label || item.product?.unit}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {((item.product?.price || 0) * (item.selectedVariant?.priceMultiplier || 1) * item.quantity).toFixed(2)}₺
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-3">Teslimat Adresi</h3>
                  <div className="p-4 rounded-lg border">
                    <p className="font-medium">{selectedOrder.shipping_address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedOrder.shipping_address.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address.district}, {selectedOrder.shipping_address.city}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notlar</h3>
                  <p className="p-4 rounded-lg border text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Oluşturulma</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Son Güncelleme</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              </div>

              {/* Status Change */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Durumu Değiştir</h3>
                <div className="flex flex-wrap gap-2">
                  {orderStatuses.map(status => {
                    const Icon = status.icon;
                    const isActive = selectedOrder.status === status.value;
                    return (
                      <Button
                        key={status.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                        disabled={isActive || isUpdating === selectedOrder.id}
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, status.value);
                          setSelectedOrder({ ...selectedOrder, status: status.value });
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {status.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
