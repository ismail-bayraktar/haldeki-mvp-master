import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw, Search, Copy, Check, Power, PowerOff, Clock, Mail, MapPin, Phone, User, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useDealers, CreateDealerInviteData, Dealer } from "@/hooks/useDealers";
import { useRegions } from "@/hooks/useRegions";
import { Checkbox } from "@/components/ui/checkbox";

const AdminDealers = () => {
  const { dealers, pendingInvites, isLoading, fetchAll, createInvite, toggleDealerActive, cancelInvite, updateDealer } = useDealers();
  const regionsQuery = useRegions();
  const regions = regionsQuery.data || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<CreateDealerInviteData>({
    email: "",
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    region_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  
  // Region edit state
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [editRegionIds, setEditRegionIds] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredDealers = dealers.filter(dealer =>
    dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        region_ids: [],
      });
    }
  };

  const handleCopyInviteInfo = (invite: typeof pendingInvites[0]) => {
    const signupUrl = `${window.location.origin}/giris`;
    const text = `Merhaba,\n\nHaldeki platformuna bayi olarak davet edildiniz.\n\nKayıt için: ${signupUrl}\nEmail: ${invite.email}\n\nBu davet 7 gün geçerlidir.`;
    
    navigator.clipboard.writeText(text);
    setCopiedInviteId(invite.id);
    toast.success('Davet bilgileri kopyalandı');
    
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const getRegionNames = (regionIds: string[]) => {
    if (!regionIds || regionIds.length === 0) return '-';
    return regionIds
      .map(id => regions.find(r => r.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

  const toggleRegion = (regionId: string) => {
    setInviteForm(prev => ({
      ...prev,
      region_ids: prev.region_ids?.includes(regionId)
        ? prev.region_ids.filter(id => id !== regionId)
        : [...(prev.region_ids || []), regionId]
    }));
  };

  const handleOpenEditDialog = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setEditRegionIds(dealer.region_ids || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRegions = async () => {
    if (!editingDealer) return;
    
    setIsUpdating(true);
    const success = await updateDealer(editingDealer.id, { region_ids: editRegionIds });
    setIsUpdating(false);
    
    if (success) {
      setIsEditDialogOpen(false);
      setEditingDealer(null);
    }
  };

  const toggleEditRegion = (regionId: string) => {
    setEditRegionIds(prev => 
      prev.includes(regionId)
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
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
          <h1 className="text-2xl font-bold text-foreground">Bayiler</h1>
          <p className="text-muted-foreground">Bayi hesaplarını görüntüleyin ve yönetin</p>
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
                Bayi Davet Et
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Bayi Daveti</DialogTitle>
                <DialogDescription>
                  Bayi bilgilerini girin. Davet oluşturulduktan sonra kayıt bilgilerini kopyalayabilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="bayi@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Firma Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Bayi Firma Adı"
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
                <div className="space-y-2">
                  <Label>Servis Bölgeleri</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {regions.map(region => (
                      <div key={region.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`region-${region.id}`}
                          checked={inviteForm.region_ids?.includes(region.id)}
                          onCheckedChange={() => toggleRegion(region.id)}
                        />
                        <label htmlFor={`region-${region.id}`} className="text-sm cursor-pointer">
                          {region.name}
                        </label>
                      </div>
                    ))}
                  </div>
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
              Henüz kayıt olmamış bayi davetleri
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
                        {invite.dealer_data?.name || 'İsimsiz'}
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

      {/* Dealers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bayi Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredDealers.length} bayi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDealers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {dealers.length === 0 ? "Henüz bayi yok" : "Aramayla eşleşen bayi bulunamadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Bölgeler</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers.map((dealer) => (
                    <TableRow key={dealer.id}>
                      <TableCell className="font-medium">{dealer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {dealer.contact_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {dealer.contact_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {dealer.contact_email}
                            </div>
                          )}
                          {dealer.contact_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {dealer.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getRegionNames(dealer.region_ids)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dealer.is_active ? "default" : "secondary"}>
                          {dealer.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(dealer.created_at), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(dealer)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Bölge
                          </Button>
                          <Button
                            variant={dealer.is_active ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => toggleDealerActive(dealer.id, dealer.is_active)}
                          >
                            {dealer.is_active ? (
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Region Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bölge Düzenle</DialogTitle>
            <DialogDescription>
              {editingDealer?.name} için bölge atamalarını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Servis Bölgeleri</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {regions.map(region => (
                <div key={region.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-region-${region.id}`}
                    checked={editRegionIds.includes(region.id)}
                    onCheckedChange={() => toggleEditRegion(region.id)}
                  />
                  <label htmlFor={`edit-region-${region.id}`} className="text-sm cursor-pointer">
                    {region.name}
                  </label>
                </div>
              ))}
            </div>
            {editRegionIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {editRegionIds.map(id => {
                  const region = regions.find(r => r.id === id);
                  return region ? (
                    <Badge key={id} variant="secondary">{region.name}</Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateRegions} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDealers;
