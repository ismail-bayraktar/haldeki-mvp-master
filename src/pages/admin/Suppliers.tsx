import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw, Search, Copy, Check, Power, PowerOff, Clock, Mail, Phone, User, Edit, CheckCircle, XCircle, AlertCircle, Key, Users, Truck, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useSuppliers, CreateSupplierInviteData, CreateDirectSupplierData, Supplier } from "@/hooks/useSuppliers";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordGenerator } from "@/components/admin/PasswordGenerator";
import { PasswordDisplayModal } from "@/components/admin/PasswordDisplayModal";
import { getTemporaryPassword } from "@/utils/passwordUtils";

const CATEGORIES = [
  { id: "sebzeler", name: "Sebzeler" },
  { id: "meyveler", name: "Meyveler" },
  { id: "yesillikler", name: "Yeşillikler" },
  { id: "narenciye", name: "Narenciye" },
  { id: "kok-sebzeler", name: "Kök Sebzeler" },
  { id: "tropikal", name: "Tropikal" }
];

const AdminSuppliers = () => {
  const { 
    suppliers, 
    pendingInvites, 
    pendingApplications,
    isLoading, 
    fetchAll, 
    createInvite,
    createDirectSupplier,
    toggleSupplierActive, 
    cancelInvite,
    approveSupplier,
    rejectSupplier 
  } = useSuppliers();
  
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'invite' | 'direct'>('invite');
  
  // Forms
  const [inviteForm, setInviteForm] = useState<CreateSupplierInviteData>({ email: "", name: "", contact_name: "", contact_phone: "", contact_email: "", product_categories: [] });
  const [directForm, setDirectForm] = useState<CreateDirectSupplierData>({ email: "", password: "", name: "", contact_name: "", contact_phone: "", contact_email: "", product_categories: [], send_email: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password display
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempUserName, setTempUserName] = useState("");
  
  // Approval
  const [approvalSupplier, setApprovalSupplier] = useState<Supplier | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Tab counts
  const pendingCount = pendingApplications.length;
  const approvedCount = suppliers.filter(s => s.approval_status === 'approved').length;
  const inviteCount = pendingInvites.length;

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) { toast.error('Email ve isim zorunludur'); return; }
    setIsSubmitting(true);
    const success = await createInvite(inviteForm);
    setIsSubmitting(false);
    if (success) {
      setIsInviteDialogOpen(false);
      setInviteForm({ email: "", name: "", contact_name: "", contact_phone: "", contact_email: "", product_categories: [] });
    }
  };

  const handleCreateDirect = async () => {
    if (!directForm.email || !directForm.name) { toast.error('Email ve isim zorunludur'); return; }
    if (!directForm.password || directForm.password.length < 6) { toast.error('Şifre en az 6 karakter olmalıdır'); return; }
    setIsSubmitting(true);
    const result = await createDirectSupplier(directForm);
    setIsSubmitting(false);
    if (result.success) {
      setIsInviteDialogOpen(false);
      setTempPassword(result.password || directForm.password);
      setTempEmail(directForm.email);
      setTempUserName(directForm.name);
      setPasswordModalOpen(true);
      setDirectForm({ email: "", password: "", name: "", contact_name: "", contact_phone: "", contact_email: "", product_categories: [], send_email: false });
    }
  };

  const handleApprovalAction = async () => {
    if (!approvalSupplier) return;
    setIsProcessing(true);
    const success = approvalAction === 'approve' ? await approveSupplier(approvalSupplier.id, approvalNotes) : await rejectSupplier(approvalSupplier.id, approvalNotes);
    setIsProcessing(false);
    if (success) { setIsApprovalDialogOpen(false); setApprovalSupplier(null); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tedarikçi Yönetimi</h1>
          <p className="text-muted-foreground">Ürün sağlayan çiftlik ve toptancıları yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Yenile
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Tedarikçi Ekle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Tedarikçi Kaydı</DialogTitle>
                <DialogDescription>Sisteme yeni ürün sağlayıcı ekleyin.</DialogDescription>
              </DialogHeader>
              <Tabs value={registrationMode} onValueChange={(v: any) => setRegistrationMode(v)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="invite">Davet Gönder</TabsTrigger>
                  <TabsTrigger value="direct">Direkt Kayıt</TabsTrigger>
                </TabsList>
                <TabsContent value="invite" className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Firma/Çiftlik Adı *</Label><Input value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Yetkili Adı</Label><Input value={inviteForm.contact_name} onChange={e => setInviteForm({...inviteForm, contact_name: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Ürün Kategorileri</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {CATEGORIES.map(c => (
                        <div key={c.id} className="flex items-center space-x-2">
                          <Checkbox id={`c-${c.id}`} checked={inviteForm.product_categories?.includes(c.name.toLowerCase())} onCheckedChange={checked => {
                            const cats = checked ? [...(inviteForm.product_categories || []), c.name.toLowerCase()] : inviteForm.product_categories?.filter(i => i !== c.name.toLowerCase());
                            setInviteForm({...inviteForm, product_categories: cats});
                          }} />
                          <label htmlFor={`c-${c.id}`} className="text-sm">{c.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="direct" className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={directForm.email} onChange={e => setDirectForm({...directForm, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Firma Adı *</Label><Input value={directForm.name} onChange={e => setDirectForm({...directForm, name: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Geçici Şifre *</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={directForm.password} onChange={e => setDirectForm({...directForm, password: e.target.value})} />
                      <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                    <PasswordGenerator onPasswordGenerated={p => setDirectForm({...directForm, password: p})} />
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>İptal</Button>
                <Button onClick={registrationMode === 'invite' ? handleCreateInvite : handleCreateDirect} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {registrationMode === 'invite' ? 'Davet Oluştur' : 'Kayıt Oluştur'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Bekleyen Başvurular
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-800">{pendingCount}</div></CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Aktif Tedarikçiler
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-800">{approvedCount}</div></CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Uzmanlık Alanları
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-800">{CATEGORIES.length} Kategori</div></CardContent>
        </Card>
      </div>

      {/* Main Tabs Structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
          <TabsTrigger value="pending" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold relative">
            Onay Bekleyenler {pendingCount > 0 && <Badge className="ml-2 bg-amber-500">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold">
            Tedarikçi Listesi
          </TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold text-muted-foreground">
            Davetler {inviteCount > 0 && <Badge variant="outline" className="ml-2">{inviteCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <div className="py-4">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>

          <TabsContent value="pending" className="m-0">
            {pendingApplications.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 border border-dashed rounded-lg">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Bekleyen yeni başvuru bulunmuyor</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingApplications.map(supplier => (
                  <Card key={supplier.id} className="border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-center">
                        <div className="flex-1 p-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">{supplier.name}</h3>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Onay Bekliyor</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><User className="h-4 w-4" /> {supplier.contact_name || '-'}</div>
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {supplier.contact_email}</div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {supplier.contact_phone || '-'}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <ShoppingBag className="h-4 w-4" />
                              {supplier.product_categories?.map(c => <Badge key={c} variant="secondary" className="text-[10px] py-0 h-4">{c}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-auto bg-muted/30 md:bg-transparent border-t md:border-t-0 md:border-l p-6 flex flex-row md:flex-col gap-2">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setApprovalSupplier(supplier); setApprovalAction('approve'); setIsApprovalDialogOpen(true); }}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Onayla
                          </Button>
                          <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setApprovalSupplier(supplier); setApprovalAction('reject'); setIsApprovalDialogOpen(true); }}>
                            <XCircle className="h-4 w-4 mr-2" /> Reddet
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="m-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma/Çiftlik</TableHead>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>Kategoriler</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.filter(s => s.approval_status !== 'pending').map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="font-bold">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground">{supplier.contact_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{supplier.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{supplier.contact_phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {supplier.product_categories?.map(c => <Badge key={c} variant="outline" className="text-[10px] font-normal">{c}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={supplier.approval_status === 'approved' ? 'default' : 'destructive'} className={supplier.approval_status === 'approved' ? 'bg-green-600' : ''}>
                            {supplier.approval_status === 'approved' ? 'Onaylı' : 'Reddedildi'}
                          </Badge>
                          <Badge variant={supplier.is_active ? 'secondary' : 'outline'}>
                            {supplier.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {supplier.user_id && getTemporaryPassword(supplier.user_id) && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Şifre Gör" onClick={() => { const p = getTemporaryPassword(supplier.user_id!); if (p) { setTempPassword(p); setTempEmail(supplier.contact_email || ''); setTempUserName(supplier.name); setPasswordModalOpen(true); } }}>
                              <Key className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${supplier.is_active ? 'text-red-500' : 'text-green-500'}`} title={supplier.is_active ? 'Pasifleştir' : 'Aktifleştir'} onClick={() => toggleSupplierActive(supplier.id, supplier.is_active)}>
                            {supplier.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="m-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Geçerlilik</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>{inv.supplier_data?.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.expires_at), 'dd MMM yyyy HH:mm', { locale: tr })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                            const signupUrl = `${window.location.origin}/tedarikci-kayit?token=${inv.id}`;
                            navigator.clipboard.writeText(`Tedarikçi Kayıt Linki: ${signupUrl}`);
                            toast.success('Davet linki kopyalandı');
                          }}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={async () => { if(await cancelInvite(inv.id)) await fetchAll(); }}><XCircle className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <PasswordDisplayModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} password={tempPassword} email={tempEmail} userName={tempUserName} />
      
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className={approvalAction === 'approve' ? 'text-green-700' : 'text-red-700'}>{approvalAction === 'approve' ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet'}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm"><strong>{approvalSupplier?.name}</strong> için işlem yapmak üzeresiniz.</p>
            <Textarea placeholder="Notlar..." value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>İptal</Button>
            <Button onClick={handleApprovalAction} disabled={isProcessing} variant={approvalAction === 'approve' ? 'default' : 'destructive'}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSuppliers;