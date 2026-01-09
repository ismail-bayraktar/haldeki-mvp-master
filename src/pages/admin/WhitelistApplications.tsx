import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Search, Mail, Phone, MapPin, CheckCircle, XCircle, Copy, Eye, Inbox, Clock, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useWhitelistApplications } from "@/hooks/useWhitelistApplications";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { WhitelistApplication } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WhitelistApplicationsPage = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const navigate = useNavigate();

  const {
    applications,
    pendingApps,
    approvedApps,
    rejectedApps,
    duplicateApps,
    isLoading,
    fetchAll,
    approveApplication,
    rejectApplication,
    markDuplicate,
  } = useWhitelistApplications();

  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const [selectedApplication, setSelectedApplication] = useState<WhitelistApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'duplicate'>('approve');
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, isAdminLoading, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleViewDetails = (application: WhitelistApplication) => {
    setSelectedApplication(application);
    setIsViewDialogOpen(true);
  };

  const handleAction = (application: WhitelistApplication, action: 'approve' | 'reject' | 'duplicate') => {
    setSelectedApplication(application);
    setActionType(action);
    setActionNotes("");
    setIsActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    let success = false;

    if (actionType === 'approve') {
      success = await approveApplication(selectedApplication.id, actionNotes);
    } else if (actionType === 'reject') {
      success = await rejectApplication(selectedApplication.id, actionNotes);
    } else if (actionType === 'duplicate') {
      success = await markDuplicate(selectedApplication.id, actionNotes);
    }

    setIsProcessing(false);

    if (success) {
      setIsActionDialogOpen(false);
      setSelectedApplication(null);
      setActionNotes("");
    }
  };

  const getFilteredApplications = (apps: WhitelistApplication[]) => {
    return apps.filter(app => {
      const matchesSearch =
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone.includes(searchTerm) ||
        (app.email && app.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesUserType = userTypeFilter === "all" || app.user_type === userTypeFilter;
      const matchesCity = cityFilter === "all" || app.city === cityFilter;

      return matchesSearch && matchesUserType && matchesCity;
    });
  };

  const cities = Array.from(new Set(applications.map(a => a.city).filter(Boolean))).sort();

  const getStatusBadge = (status: WhitelistApplication['status']) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      duplicate: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const labels = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      duplicate: 'Kopya',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (isAdminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="whitelist-applications-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Whitelist Başvuruları</h1>
          <p className="text-muted-foreground">Erken erişim başvurularını yönetin</p>
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Toplam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{applications.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{pendingApps.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Onaylanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">{approvedApps.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Reddedilen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{rejectedApps.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim, telefon veya email ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Kullanıcı Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="B2B">B2B</SelectItem>
            <SelectItem value="B2C">B2C</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Şehir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city!}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold"
          >
            Bekleyen {pendingApps.length > 0 && <Badge className="ml-2 bg-amber-500">{pendingApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold"
          >
            Onaylanan {approvedApps.length > 0 && <Badge variant="outline" className="ml-2">{approvedApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold"
          >
            Reddedilen {rejectedApps.length > 0 && <Badge variant="outline" className="ml-2">{rejectedApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="duplicate"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-2 pb-3 pt-0 font-semibold"
          >
            Kopyalar {duplicateApps.length > 0 && <Badge variant="outline" className="ml-2">{duplicateApps.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <div className="py-4">
          <TabsContent value="pending" className="m-0">
            {getFilteredApplications(pendingApps).length === 0 ? (
              <div className="text-center py-12 bg-muted/20 border border-dashed rounded-lg">
                <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Bekleyen başvuru bulunmuyor</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getFilteredApplications(pendingApps).map((application) => (
                  <Card key={application.id} className="border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-center">
                        <div className="flex-1 p-6 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold">{application.full_name}</h3>
                            <Badge variant="outline" className={application.user_type === 'B2B' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                              {application.user_type}
                            </Badge>
                            {getStatusBadge(application.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {application.phone}
                            </div>
                            {application.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {application.email}
                              </div>
                            )}
                            {(application.city || application.district) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {[application.city, application.district].filter(Boolean).join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(application.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-auto bg-muted/30 md:bg-transparent border-t md:border-t-0 md:border-l p-6 flex flex-row md:flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(application)}
                            className="flex-1"
                            data-testid={`view-details-button-${application.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detay
                          </Button>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAction(application, 'approve')}
                            data-testid={`approve-button-${application.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Onayla
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction(application, 'reject')}
                            data-testid={`reject-button-${application.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reddet
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="m-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başvuran</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredApplications(approvedApps).map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.full_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{application.phone}</p>
                          {application.email && <p className="text-muted-foreground">{application.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {[application.city, application.district].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{application.user_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(application.created_at), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(application)}
                          data-testid={`view-details-button-${application.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="m-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başvuran</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredApplications(rejectedApps).map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.full_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{application.phone}</p>
                          {application.email && <p className="text-muted-foreground">{application.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {[application.city, application.district].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{application.user_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(application.created_at), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(application)}
                          data-testid={`view-details-button-${application.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="duplicate" className="m-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başvuran</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredApplications(duplicateApps).map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.full_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{application.phone}</p>
                          {application.email && <p className="text-muted-foreground">{application.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {[application.city, application.district].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{application.user_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(application.created_at), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(application)}
                          data-testid={`view-details-button-${application.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Başvuru Detayları</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ad Soyad</p>
                <p className="font-medium">{selectedApplication.full_name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{selectedApplication.phone}</p>
              </div>
              {selectedApplication.email && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
              )}
              {(selectedApplication.city || selectedApplication.district) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Konum</p>
                  <p className="font-medium">
                    {[selectedApplication.city, selectedApplication.district].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kullanıcı Tipi</p>
                <Badge variant="outline">{selectedApplication.user_type}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Durum</p>
                {getStatusBadge(selectedApplication.status)}
              </div>
              {selectedApplication.notes && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedApplication.notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kaynak</p>
                <p className="text-sm">{selectedApplication.source}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Başvuru Tarihi</p>
                <p className="text-sm">
                  {format(new Date(selectedApplication.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={
              actionType === 'approve' ? 'text-green-700' :
              actionType === 'reject' ? 'text-red-700' :
              'text-slate-700'
            }>
              {actionType === 'approve' ? 'Başvuruyu Onayla' :
               actionType === 'reject' ? 'Başvuruyu Reddet' :
               'Kopya Olarak İşaretle'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              <strong>{selectedApplication?.full_name}</strong> için işlem yapmak üzeresiniz.
            </p>
            <Textarea
              placeholder="Not ekleyin (opsiyonel)..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={executeAction}
              disabled={isProcessing}
              variant={
                actionType === 'approve' ? 'default' :
                actionType === 'reject' ? 'destructive' :
                'outline'
              }
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Onayla' :
               actionType === 'reject' ? 'Reddet' :
               'İşaretle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhitelistApplicationsPage;
