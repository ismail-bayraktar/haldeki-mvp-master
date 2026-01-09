import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw, Search, Key, Power, PowerOff, Mail, MapPin, Phone, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useBusinesses, Business } from "@/hooks/useBusinesses";
import { useRegions } from "@/hooks/useRegions";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordGenerator } from "@/components/admin/PasswordGenerator";
import { PasswordDisplayModal } from "@/components/admin/PasswordDisplayModal";
import { getTemporaryPassword } from "@/utils/passwordUtils";
import { Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const AdminBusinesses = () => {
  const { 
    businesses, 
    pendingInvites,
    pendingApplications,
    isLoading, 
    fetchAll, 
    approveBusiness,
    rejectBusiness,
    createDirectBusiness,
    createBusinessInvite
  } = useBusinesses();
  
  const regionsQuery = useRegions();
  const regions = regionsQuery.data || [];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'invite' | 'direct'>('invite');
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    contact_name: "",
    region_ids: [] as string[],
  });

  // Direct registration form
  const [directForm, setDirectForm] = useState({
    email: "",
    password: "",
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    region_ids: [] as string[],
    tax_number: "",
    business_type: "",
    send_email: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password display modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempUserName, setTempUserName] = useState("");

  // Approval state
  const [approvalBusiness, setApprovalBusiness] = useState<Business | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredBusinesses = businesses.filter(b =>
    b.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Email ve işletme adı zorunludur');
      return;
    }

    setIsSubmitting(true);
    const result = await createBusinessInvite(inviteForm);
    setIsSubmitting(false);

    if (result.success) {
      setIsInviteDialogOpen(false);
      setInviteForm({
        email: "",
        name: "",
        contact_name: "",
        region_ids: [],
      });
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
    const result = await createDirectBusiness(directForm);
    setIsSubmitting(false);

    if (result.success) {
      setIsInviteDialogOpen(false);
      setTempPassword(directForm.password);
      setTempEmail(directForm.email);
      setTempUserName(directForm.name);
      setPasswordModalOpen(true);
      
      setDirectForm({
        email: "",
        password: "",
        name: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        region_ids: [],
        tax_number: "",
        business_type: "",
        send_email: false,
      });
    }
  };

  const handleApprovalAction = async () => {
    if (!approvalBusiness) return;
    
    setIsProcessing(true);
    const success = approvalAction === 'approve' 
      ? await approveBusiness(approvalBusiness.id, approvalNotes)
      : await rejectBusiness(approvalBusiness.id, approvalNotes);
    setIsProcessing(false);
    
    if (success) {
      setIsApprovalDialogOpen(false);
      setApprovalBusiness(null);
    }
  };

  const getRegionNames = (regionIds: string[]) => {
    if (!regionIds || regionIds.length === 0) return '-';
    return regionIds
      .map(id => regions.find(r => r.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
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
            <h1 className="text-2xl font-bold text-foreground">İşletmeler (B2B)</h1>
            <p className="text-muted-foreground">Restoran, kafe ve otel hesaplarını yönetin</p>
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
                  İşletme Ekle
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni İşletme Ekle</DialogTitle>
              </DialogHeader>
              <Tabs value={registrationMode} onValueChange={(v: any) => setRegistrationMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="invite">Davet Gönder</TabsTrigger>
                  <TabsTrigger value="direct">Direkt Kayıt</TabsTrigger>
                </TabsList>
                
                <TabsContent value="invite" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="i-email">Email *</Label>
                    <Input id="i-email" type="email" placeholder="isletme@ornek.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="i-name">İşletme Adı *</Label>
                    <Input id="i-name" placeholder="Firma Ünvanı" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="i-contact">Yetkili Adı</Label>
                    <Input id="i-contact" placeholder="İsim Soyisim" value={inviteForm.contact_name} onChange={e => setInviteForm({...inviteForm, contact_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hizmet Alabileceği Bölgeler</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {regions.map(r => (
                        <div key={r.id} className="flex items-center space-x-2">
                          <Checkbox id={`i-reg-${r.id}`} checked={inviteForm.region_ids.includes(r.id)} onCheckedChange={checked => {
                            const ids = checked ? [...inviteForm.region_ids, r.id] : inviteForm.region_ids.filter(id => id !== r.id);
                            setInviteForm({...inviteForm, region_ids: ids});
                          }} />
                          <label htmlFor={`i-reg-${r.id}`} className="text-sm">{r.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="direct" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="b-email">Email *</Label>
                    <Input id="b-email" type="email" value={directForm.email} onChange={e => setDirectForm({...directForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-name">İşletme Adı *</Label>
                    <Input id="b-name" value={directForm.name} onChange={e => setDirectForm({...directForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-pass">Geçici Şifre *</Label>
                    <div className="relative">
                      <Input id="b-pass" type={showPassword ? "text" : "password"} value={directForm.password} onChange={e => setDirectForm({...directForm, password: e.target.value})} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <PasswordGenerator onPasswordGenerated={p => setDirectForm({...directForm, password: p})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>İşletme Türü</Label>
                      <Input value={directForm.business_type} onChange={e => setDirectForm({...directForm, business_type: e.target.value})} placeholder="Restoran, vb." />
                    </div>
                    <div className="space-y-2">
                      <Label>Vergi No</Label>
                      <Input value={directForm.tax_number} onChange={e => setDirectForm({...directForm, tax_number: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bölgeler</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {regions.map(r => (
                        <div key={r.id} className="flex items-center space-x-2">
                          <Checkbox id={`b-reg-${r.id}`} checked={directForm.region_ids.includes(r.id)} onCheckedChange={checked => {
                            const ids = checked ? [...directForm.region_ids, r.id] : directForm.region_ids.filter(id => id !== r.id);
                            setDirectForm({...directForm, region_ids: ids});
                          }} />
                          <label htmlFor={`b-reg-${r.id}`} className="text-sm">{r.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>İptal</Button>
                <Button onClick={registrationMode === 'invite' ? handleSendInvite : handleCreateDirect} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {registrationMode === 'invite' ? 'Davet Gönder' : 'Kayıt Oluştur'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {pendingInvites.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Bekleyen Davetler
              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700">{pendingInvites.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Son Gün</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map(inv => (
                  <TableRow key={inv.id} className="bg-white/50">
                    <TableCell className="font-medium">{inv.business_data?.name}</TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(inv.expires_at), 'd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Cancellation logic could be added here */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pendingApplications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Onay Bekleyen Başvurular
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-700">{pendingApplications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApplications.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div>
                    <p className="font-bold">{b.company_name}</p>
                    <p className="text-sm text-muted-foreground">{b.contact_name} ({b.contact_email})</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => { setApprovalBusiness(b); setApprovalAction('approve'); setIsApprovalDialogOpen(true); }}>Onayla</Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setApprovalBusiness(b); setApprovalAction('reject'); setIsApprovalDialogOpen(true); }}>Reddet</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>İşletme Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Bölgeler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="font-medium">{b.company_name}</p>
                    <p className="text-xs text-muted-foreground">{b.business_type || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{b.contact_name}</p>
                      <p className="text-muted-foreground">{b.contact_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getRegionNames(b.region_ids)}</TableCell>
                  <TableCell>
                    <Badge variant={b.approval_status === 'approved' ? 'default' : 'outline'}>
                      {b.approval_status === 'approved' ? 'Onaylı' : b.approval_status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.user_id && getTemporaryPassword(b.user_id) && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const p = getTemporaryPassword(b.user_id!);
                        if (p) { setTempPassword(p); setTempEmail(b.contact_email || ''); setTempUserName(b.company_name); setPasswordModalOpen(true); }
                      }}><Key className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PasswordDisplayModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} password={tempPassword} email={tempEmail} userName={tempUserName} />
      
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === 'approve' ? 'Onayla' : 'Reddet'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm"><strong>{approvalBusiness?.company_name}</strong> için işlem yapmak üzeresiniz.</p>
            <Textarea placeholder="Notlar..." value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>İptal</Button>
            <Button onClick={handleApprovalAction} disabled={isProcessing} variant={approvalAction === 'approve' ? 'default' : 'destructive'}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBusinesses;
