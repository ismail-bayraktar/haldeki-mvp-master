import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw, Search, Copy, Check, Power, PowerOff, Clock, Mail, MapPin, Phone, User, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useDealers, CreateDealerInviteData, CreateDirectDealerData, Dealer } from "@/hooks/useDealers";
import { useRegions } from "@/hooks/useRegions";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordGenerator } from "@/components/admin/PasswordGenerator";
import { PasswordDisplayModal } from "@/components/admin/PasswordDisplayModal";
import { generatePassword, getTemporaryPassword } from "@/utils/passwordUtils";
import { Eye, EyeOff, Key } from "lucide-react";

const AdminDealers = () => {
  const { 
    dealers, 
    pendingInvites, 
    pendingApplications,
    isLoading, 
    fetchAll, 
    createInvite,
    createDirectDealer,
    toggleDealerActive, 
    cancelInvite, 
    updateDealer,
    approveDealer,
    rejectDealer 
  } = useDealers();
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
  
  // Registration mode: 'invite' or 'direct'
  const [registrationMode, setRegistrationMode] = useState<'invite' | 'direct'>('invite');
  
  // Direct registration form
  const [directForm, setDirectForm] = useState<CreateDirectDealerData>({
    email: "",
    password: "",
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    region_ids: [],
    tax_number: "",
    send_email: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Password display modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempUserName, setTempUserName] = useState("");
  
  // Region edit state
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [editRegionIds, setEditRegionIds] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Approval state
  const [approvalDealer, setApprovalDealer] = useState<Dealer | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
      setRegistrationMode('invite');
    }
  };

  const handleCreateDirect = async () => {
    if (!directForm.email || !directForm.name) {
      toast.error('Email ve isim zorunludur');
      return;
    }

    if (!directForm.password || directForm.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsSubmitting(true);
    const result = await createDirectDealer(directForm);
    setIsSubmitting(false);

    if (result.success) {
      // Close the invite dialog first
      setIsInviteDialogOpen(false);
      
      // Show password modal
      setTempPassword(result.password || directForm.password);
      setTempEmail(directForm.email);
      setTempUserName(directForm.name);
      setPasswordModalOpen(true);
      
      // Reset form
      setDirectForm({
        email: "",
        password: "",
        name: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        region_ids: [],
        tax_number: "",
        send_email: false,
      });
      setShowPassword(false);
      setRegistrationMode('invite');
      
      // Fetch updated list (already called in createDirectDealer, but ensure it's done)
      await fetchAll();
    }
  };

  const handlePasswordGenerated = (password: string) => {
    setDirectForm(prev => ({ ...prev, password }));
  };

  const handleCopyInviteInfo = (invite: typeof pendingInvites[0]) => {
    const signupUrl = `${window.location.origin}/bayi-kayit?token=${invite.id}`;
    const text = `Merhaba,\n\nHaldeki platformuna bayi olarak davet edildiniz.\n\nKayıt için: ${signupUrl}\nEmail: ${invite.email}\n\nBu davet 7 gün geçerlidir.`;
    
    navigator.clipboard.writeText(text);
    setCopiedInviteId(invite.id);
    toast.success('Davet bilgileri kopyalandı');
    
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handleOpenApprovalDialog = (dealer: Dealer, action: 'approve' | 'reject') => {
    setApprovalDealer(dealer);
    setApprovalAction(action);
    setApprovalNotes("");
    setIsApprovalDialogOpen(true);
  };

  const handleApprovalAction = async () => {
    if (!approvalDealer) return;
    
    setIsProcessing(true);
    let success = false;
    
    if (approvalAction === 'approve') {
      success = await approveDealer(approvalDealer.id, approvalNotes);
    } else {
      success = await rejectDealer(approvalDealer.id, approvalNotes);
    }
    
    setIsProcessing(false);
    
    if (success) {
      setIsApprovalDialogOpen(false);
      setApprovalDealer(null);
      setApprovalNotes("");
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 hover:text-yellow-900">Onay Bekliyor</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="hover:text-white">Reddedildi</Badge>;
      default:
        return null;
    }
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
            <DialogContent 
              className="max-w-md max-h-[90vh] overflow-y-auto"
              onKeyDown={(e) => {
                // Prevent form submission on Enter key
                if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Yeni Bayi Ekle</DialogTitle>
                <DialogDescription>
                  Davet göndererek veya direkt kayıt yaparak yeni bayi ekleyebilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <Tabs 
                value={registrationMode} 
                onValueChange={(v) => {
                  setRegistrationMode(v as 'invite' | 'direct');
                }} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="invite">Davet Gönder</TabsTrigger>
                  <TabsTrigger value="direct">Direkt Kayıt</TabsTrigger>
                </TabsList>
                <TabsContent value="invite" className="space-y-4 py-4">
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
                </TabsContent>
                <TabsContent value="direct" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="direct-email">Email *</Label>
                    <Input
                      id="direct-email"
                      type="email"
                      placeholder="bayi@example.com"
                      value={directForm.email}
                      onChange={(e) => setDirectForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct-name">Firma Adı *</Label>
                    <Input
                      id="direct-name"
                      placeholder="Bayi Firma Adı"
                      value={directForm.name}
                      onChange={(e) => setDirectForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct-password">Geçici Şifre *</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          id="direct-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="En az 6 karakter"
                          value={directForm.password}
                          onChange={(e) => setDirectForm(prev => ({ ...prev, password: e.target.value }))}
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <PasswordGenerator onPasswordGenerated={handlePasswordGenerated} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct-contact_name">Yetkili Adı</Label>
                    <Input
                      id="direct-contact_name"
                      placeholder="Ad Soyad"
                      value={directForm.contact_name}
                      onChange={(e) => setDirectForm(prev => ({ ...prev, contact_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct-contact_phone">Telefon</Label>
                    <Input
                      id="direct-contact_phone"
                      placeholder="0555 555 55 55"
                      value={directForm.contact_phone}
                      onChange={(e) => setDirectForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direct-tax_number">Vergi Numarası</Label>
                    <Input
                      id="direct-tax_number"
                      placeholder="Vergi Numarası"
                      value={directForm.tax_number}
                      onChange={(e) => setDirectForm(prev => ({ ...prev, tax_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servis Bölgeleri</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {regions.map(region => (
                        <div key={region.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`direct-region-${region.id}`}
                            checked={directForm.region_ids?.includes(region.id)}
                            onCheckedChange={() => {
                              setDirectForm(prev => ({
                                ...prev,
                                region_ids: prev.region_ids?.includes(region.id)
                                  ? prev.region_ids.filter(id => id !== region.id)
                                  : [...(prev.region_ids || []), region.id]
                              }));
                            }}
                          />
                          <label htmlFor={`direct-region-${region.id}`} className="text-sm cursor-pointer">
                            {region.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-email"
                      checked={directForm.send_email}
                      onCheckedChange={(checked) => setDirectForm(prev => ({ ...prev, send_email: checked === true }))}
                    />
                    <label htmlFor="send-email" className="text-sm cursor-pointer">
                      Email gönder (geçici şifre ve giriş bilgileri)
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsInviteDialogOpen(false);
                  setRegistrationMode('invite');
                }}>
                  İptal
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (registrationMode === 'invite') {
                      handleCreateInvite();
                    } else {
                      handleCreateDirect();
                    }
                  }} 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {registrationMode === 'invite' ? 'Davet Oluştur' : 'Kayıt Oluştur'}
                </Button>
              </DialogFooter>
            </DialogContent>
            <PasswordDisplayModal
              open={passwordModalOpen}
              onOpenChange={(open) => {
                setPasswordModalOpen(open);
                if (!open) {
                  // Refresh list when modal closes
                  fetchAll();
                }
              }}
              password={tempPassword}
              email={tempEmail}
              userName={tempUserName}
            />
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

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Onay Bekleyen Başvurular
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-700">
                {pendingApplications.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Kayıt olmuş ve onay bekleyen bayi başvuruları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApplications.map(dealer => (
                <div key={dealer.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{dealer.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {dealer.contact_name || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {dealer.contact_email || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {dealer.contact_phone || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getRegionNames(dealer.region_ids)}
                      </div>
                    </div>
                    {dealer.tax_number && (
                      <p className="text-xs text-muted-foreground">
                        Vergi No: {dealer.tax_number}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => handleOpenApprovalDialog(dealer, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Onayla
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleOpenApprovalDialog(dealer, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reddet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      onClick={async () => {
                        const success = await cancelInvite(invite.id);
                        if (success) {
                          await fetchAll();
                        }
                      }}
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
                        <div className="flex flex-col gap-1">
                          {getApprovalBadge(dealer.approval_status)}
                          <Badge 
                            variant={dealer.is_active ? "default" : "secondary"} 
                            className={`text-xs ${dealer.is_active ? 'bg-green-700 text-white hover:bg-green-800' : 'hover:text-foreground'}`}
                          >
                            {dealer.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
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
                          {dealer.user_id && getTemporaryPassword(dealer.user_id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const password = getTemporaryPassword(dealer.user_id!);
                                if (password) {
                                  setTempPassword(password);
                                  setTempEmail(dealer.contact_email || dealer.email || '');
                                  setTempUserName(dealer.name);
                                  setPasswordModalOpen(true);
                                }
                              }}
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Şifre Gör
                            </Button>
                          )}
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={approvalAction === 'approve' ? 'text-green-700' : 'text-red-700'}>
              {approvalAction === 'approve' ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet'}
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{approvalDealer?.name}</span> firmasının başvurusunu{' '}
              {approvalAction === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {approvalDealer && (
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><strong>Yetkili:</strong> {approvalDealer.contact_name || '-'}</p>
                <p><strong>Email:</strong> {approvalDealer.contact_email || '-'}</p>
                <p><strong>Telefon:</strong> {approvalDealer.contact_phone || '-'}</p>
                {approvalDealer.tax_number && (
                  <p><strong>Vergi No:</strong> {approvalDealer.tax_number}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="approval-notes">
                {approvalAction === 'approve' ? 'Not (opsiyonel)' : 'Red Sebebi (opsiyonel)'}
              </Label>
              <Textarea
                id="approval-notes"
                placeholder={approvalAction === 'approve' 
                  ? 'Onay ile ilgili not ekleyin...' 
                  : 'Red sebebini belirtin...'}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleApprovalAction} 
              disabled={isProcessing}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDealers;
