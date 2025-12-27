import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Edit, 
  Trash2,
  RotateCcw,
  Home,
  LogOut,
  ChevronLeft,
  Search,
} from "lucide-react";
import { useDealerProfile } from "@/hooks/useDealerProfile";
import { useDealerCustomers, CreateCustomerData, DealerCustomer } from "@/hooks/useDealerCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const customerSchema = z.object({
  business_name: z.string().min(2, 'Firma adı en az 2 karakter olmalı'),
  contact_name: z.string().optional(),
  phone: z.string().min(10, 'Geçerli bir telefon numarası girin'),
  email: z.string().email('Geçerli bir email adresi girin').optional().or(z.literal('')),
  address: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const DealerCustomers = () => {
  const { logout } = useAuth();
  const { dealer, isLoading: profileLoading } = useDealerProfile();
  const { 
    activeCustomers, 
    inactiveCustomers,
    isLoading: customersLoading, 
    createCustomer, 
    updateCustomer,
    deleteCustomer,
    activateCustomer,
  } = useDealerCustomers(dealer?.id || null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<DealerCustomer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      business_name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      district: '',
      notes: '',
    },
  });

  const handleAddCustomer = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    const success = await createCustomer(data as CreateCustomerData);
    if (success) {
      setIsAddDialogOpen(false);
      form.reset();
    }
    setIsSubmitting(false);
  };

  const handleEditCustomer = async (data: CustomerFormData) => {
    if (!editingCustomer) return;
    setIsSubmitting(true);
    const success = await updateCustomer(editingCustomer.id, data);
    if (success) {
      setEditingCustomer(null);
      form.reset();
    }
    setIsSubmitting(false);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmId) return;
    await deleteCustomer(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const openEditDialog = (customer: DealerCustomer) => {
    form.reset({
      business_name: customer.business_name,
      contact_name: customer.contact_name || '',
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      district: customer.district || '',
      notes: customer.notes || '',
    });
    setEditingCustomer(customer);
  };

  const filteredActiveCustomers = activeCustomers.filter(c => 
    c.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const filteredInactiveCustomers = inactiveCustomers.filter(c => 
    c.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (profileLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CustomerFormContent = ({ onSubmit, submitText }: { onSubmit: (data: CustomerFormData) => void; submitText: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="business_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firma/İşletme Adı *</FormLabel>
              <FormControl>
                <Input placeholder="Örn: ABC Restoran" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yetkili Kişi</FormLabel>
                <FormControl>
                  <Input placeholder="Ad Soyad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input placeholder="05XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@ornek.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İlçe/Semt</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Kadıköy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Textarea placeholder="Tam adres..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea placeholder="İşletme hakkında notlar..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const renderCustomerTable = (customers: DealerCustomer[], showReactivate = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İşletme Adı</TableHead>
          <TableHead>Yetkili</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>İlçe</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customer.business_name}</span>
              </div>
            </TableCell>
            <TableCell>{customer.contact_name || '-'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {customer.phone}
              </div>
            </TableCell>
            <TableCell>{customer.district || '-'}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                {showReactivate ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => activateCustomer(customer.id)}
                    title="Aktifleştir"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(customer)}
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(customer.id)}
                      title="Pasifleştir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/bayi">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Müşterilerim</h1>
                <p className="text-muted-foreground">
                  İşletme ve müşteri kayıtlarınızı yönetin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {activeCustomers.length} aktif müşteri
              </Badge>
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Siteye Git
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Müşteri Listesi
                </CardTitle>
                <CardDescription>Teslimat yaptığınız işletmeleri kaydedin ve yönetin</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) form.reset();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Müşteri
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir işletme veya müşteri kaydı oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <CustomerFormContent onSubmit={handleAddCustomer} submitText="Kaydet" />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Arama */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Aktif ({filteredActiveCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Pasif ({filteredInactiveCustomers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {filteredActiveCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz müşteri kaydı bulunmuyor</p>
                    <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>
                      İlk müşterinizi ekleyin
                    </Button>
                  </div>
                ) : (
                  renderCustomerTable(filteredActiveCustomers)
                )}
              </TabsContent>

              <TabsContent value="inactive">
                {filteredInactiveCustomers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Pasif müşteri yok</p>
                ) : (
                  renderCustomerTable(filteredInactiveCustomers, true)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Düzenleme Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => {
        if (!open) {
          setEditingCustomer(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
            <DialogDescription>
              Müşteri bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <CustomerFormContent onSubmit={handleEditCustomer} submitText="Güncelle" />
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Pasifleştir</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müşteriyi pasifleştirmek istediğinize emin misiniz? 
              Daha sonra tekrar aktifleştirebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer}>
              Pasifleştir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealerCustomers;

