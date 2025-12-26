import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw, Search, Copy, Check, Power, PowerOff, Clock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useSuppliers, CreateSupplierInviteData } from "@/hooks/useSuppliers";

const AdminSuppliers = () => {
  const { suppliers, pendingInvites, isLoading, fetchAll, createInvite, toggleSupplierActive, cancelInvite } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<CreateSupplierInviteData>({
    email: "",
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Email ve isim zorunludur');
      return;
    }

    setIsSubmitting(true);
    const success = await createInvite(inviteForm);
    setIsSubmitting(false);

    if (success) {
      setIsInviteDialogOpen(false);
      setInviteForm({
        email: "",
        name: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });
    }
  };

  const handleCopyInviteInfo = (invite: typeof pendingInvites[0]) => {
    const signupUrl = `${window.location.origin}/giris`;
    const text = `Merhaba,\n\nHaldeki platformuna tedarikçi olarak davet edildiniz.\n\nKayıt için: ${signupUrl}\nEmail: ${invite.email}\n\nBu davet 7 gün geçerlidir.`;
    
    navigator.clipboard.writeText(text);
    setCopiedInviteId(invite.id);
    toast.success('Davet bilgileri kopyalandı');
    
    setTimeout(() => setCopiedInviteId(null), 2000);
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
          <h1 className="text-2xl font-bold text-foreground">Tedarikçiler</h1>
          <p className="text-muted-foreground">Tedarikçi hesaplarını görüntüleyin ve yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tedarikçi Davet Et
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Tedarikçi Daveti</DialogTitle>
                <DialogDescription>
                  Tedarikçi bilgilerini girin. Davet oluşturulduktan sonra kayıt bilgilerini kopyalayabilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tedarikci@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Firma Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Tedarikçi Firma Adı"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Yetkili Adı</Label>
                  <Input
                    id="contact_name"
                    placeholder="Ad Soyad"
                    value={inviteForm.contact_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, contact_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    placeholder="0555 555 55 55"
                    value={inviteForm.contact_phone}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateInvite} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Davet Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="İsim veya email ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bekleyen Davetler
            </CardTitle>
            <CardDescription>
              Henüz kayıt olmamış tedarikçi davetleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invite.email}</span>
                      <Badge variant="outline">
                        {invite.supplier_data?.name || 'İsimsiz'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Geçerlilik: {format(new Date(invite.expires_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteInfo(invite)}
                    >
                      {copiedInviteId === invite.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredSuppliers.length} tedarikçi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {suppliers.length === 0 ? "Henüz tedarikçi yok" : "Aramayla eşleşen tedarikçi bulunamadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {supplier.contact_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {supplier.contact_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {supplier.contact_email}
                            </div>
                          )}
                          {supplier.contact_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {supplier.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.is_active ? "default" : "secondary"}>
                          {supplier.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(supplier.created_at), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={supplier.is_active ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleSupplierActive(supplier.id, supplier.is_active)}
                        >
                          {supplier.is_active ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Pasifleştir
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Aktifleştir
                            </>
                          )}
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
    </div>
  );
};

export default AdminSuppliers;
