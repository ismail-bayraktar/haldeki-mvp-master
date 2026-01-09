import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Check, X } from "lucide-react";
import { useAdminOffers } from "@/hooks/useAdminOffers";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Beklemede</Badge>;
    case 'approved':
      return <Badge className="bg-green-600">Onaylandı</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Reddedildi</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const SupplierOffers = () => {
  const { offers, isLoading, updateOfferStatus } = useAdminOffers();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (offerId: string) => {
    setProcessingId(offerId);
    await updateOfferStatus(offerId, 'approved');
    setProcessingId(null);
  };

  const handleReject = async (offerId: string) => {
    setProcessingId(offerId);
    await updateOfferStatus(offerId, 'rejected');
    setProcessingId(null);
  };

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const approvedOffers = offers.filter(o => o.status === 'approved');
  const rejectedOffers = offers.filter(o => o.status === 'rejected');

  const renderTable = (offerList: typeof offers, showActions: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tedarikçi</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead>Güncel Fiyat</TableHead>
          <TableHead>Teklif Fiyatı</TableHead>
          <TableHead>Miktar</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Tarih</TableHead>
          {showActions && <TableHead>İşlemler</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {offerList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8 text-muted-foreground">
              Teklif bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          offerList.map((offer) => {
            const priceDiff = offer.product 
              ? ((offer.offered_price - offer.product.price) / offer.product.price * 100).toFixed(1)
              : '0';
            const isLower = parseFloat(priceDiff) < 0;
            
            return (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">
                  {offer.supplier?.name || 'Bilinmeyen'}
                </TableCell>
                <TableCell>{offer.product?.name || 'Bilinmeyen'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {offer.product?.price.toFixed(2)} ₺/{offer.product?.unit}
                </TableCell>
                <TableCell>
                  <span className={isLower ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {offer.offered_price.toFixed(2)} ₺/{offer.unit}
                  </span>
                  <span className={`text-xs ml-2 ${isLower ? 'text-green-600' : 'text-red-600'}`}>
                    ({isLower ? '' : '+'}{priceDiff}%)
                  </span>
                </TableCell>
                <TableCell>{offer.offered_quantity} {offer.unit}</TableCell>
                <TableCell>{getStatusBadge(offer.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(offer.created_at), 'dd MMM yyyy', { locale: tr })}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(offer.id)}
                        disabled={processingId === offer.id}
                      >
                        {processingId === offer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(offer.id)}
                        disabled={processingId === offer.id}
                      >
                        {processingId === offer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tedarikçi Teklifleri</h1>
          <p className="text-muted-foreground">Ürün fiyat tekliflerini yönetin</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tüm Teklifler
              </CardTitle>
              <CardDescription>
                {pendingOffers.length} bekleyen, {approvedOffers.length} onaylanan, {rejectedOffers.length} reddedilen teklif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">
                    Bekleyen ({pendingOffers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Onaylanan ({approvedOffers.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Reddedilen ({rejectedOffers.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                  {renderTable(pendingOffers, true)}
                </TabsContent>
                <TabsContent value="approved">
                  {renderTable(approvedOffers)}
                </TabsContent>
                <TabsContent value="rejected">
                  {renderTable(rejectedOffers)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default SupplierOffers;
