/**
 * Warehouse Staff Form Component
 * Phase 11 - Warehouse MVP
 *
 * Yeni warehouse staff ekleme/mevcut staff düzenleme formu
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, Building2, MapPin, AlertCircle, Search, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllUsers } from '@/hooks/useUsers';
import { useVendors } from '@/hooks/useVendors';
import { useRegions } from '@/hooks/useRegions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const formSchema = z.object({
  user_id: z.string().min(1, 'Kullanıcı seçilmelidir'),
  vendor_id: z.string().min(1, 'Tedarikçi seçilmelidir'),
  warehouse_id: z.string().min(1, 'Bölge seçilmelidir'),
  is_active: z.boolean().default(true),
});

export type WarehouseStaffFormValues = z.infer<typeof formSchema>;

interface WarehouseStaffFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WarehouseStaffFormValues) => void;
  isLoading?: boolean;
  initialData?: Partial<WarehouseStaffFormValues>;
  mode: 'create' | 'edit';
}

export function WarehouseStaffForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
  mode,
}: WarehouseStaffFormProps) {
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: regions, isLoading: regionsLoading } = useRegions();

  // Search state for filtering users
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<WarehouseStaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: initialData?.user_id || '',
      vendor_id: initialData?.vendor_id || '',
      warehouse_id: initialData?.warehouse_id || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  // Watch selected user_id to fetch existing assignments
  const selectedUserId = form.watch('user_id');

  // Query existing assignments for selected user
  const { data: existingAssignments } = useQuery({
    queryKey: ['user-warehouse-assignments', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];

      const { data, error } = await supabase
        .from('warehouse_staff')
        .select(`
          vendor_id,
          warehouse_id,
          vendors (name),
          regions (name)
        `)
        .eq('user_id', selectedUserId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedUserId && mode === 'create',
  });

  // Filter users by search query
  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = (user.full_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  }) || [];

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        user_id: initialData.user_id || '',
        vendor_id: initialData.vendor_id || '',
        warehouse_id: initialData.warehouse_id || '',
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: WarehouseStaffFormValues) => {
    onSubmit(data);
  };

  const isLoadingData = usersLoading || vendorsLoading || regionsLoading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <User className="h-5 w-5" />
                Yeni Depo Personeli Ekle
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                Depo Personeli Düzenle
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Sisteme yeni depo personeli ekleyin. Bu kullanıcı seçilen tedarikçinin bölgesinde depo yetkisine sahip olacak.'
              : 'Depo personeli bilgilerini düzenleyin. Kullanıcı, tedarikçi ve bölge bilgileri değiştirilemez.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* User Selection with Search */}
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Kullanıcı
                    </FormLabel>

                    {/* Search Input */}
                    {mode === 'create' && (
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="İsim veya email ile ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    )}

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger className={mode === 'edit' ? 'bg-muted' : ''}>
                          <SelectValue placeholder="Kullanıcı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredUsers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {searchQuery ? 'Kullanıcı bulunamadı' : 'Kullanıcı yükleniyor...'}
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col gap-1 py-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {user.full_name || 'İsimsiz'}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {mode === 'edit' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Kullanıcı değiştirilemez
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Existing Assignments Alert (Create Mode Only) */}
              {mode === 'create' && existingAssignments && existingAssignments.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Mevcut Depo Atamaları:</div>
                    <ul className="text-sm space-y-1">
                      {existingAssignments.map((assignment: any) => (
                        <li key={`${assignment.vendor_id}-${assignment.warehouse_id}`}>
                          • {assignment.vendors?.name} - {assignment.regions?.name}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Vendor Selection */}
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Tedarikçi
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger className={mode === 'edit' ? 'bg-muted' : ''}>
                          <SelectValue placeholder="Tedarikçi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors?.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mode === 'edit' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tedarikçi değiştirilemez
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warehouse/Region Selection */}
              <FormField
                control={form.control}
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Bölge
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger className={mode === 'edit' ? 'bg-muted' : ''}>
                          <SelectValue placeholder="Bölge seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions?.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mode === 'edit' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bölge değiştirilemez
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status - Only in Edit Mode */}
              {mode === 'edit' && (
                <>
                  <div className="border-t pt-4">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-muted/30 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                              {field.value ? (
                                <Badge variant="default" className="gap-1">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  Pasif
                                </Badge>
                              )}
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              {field.value
                                ? 'Personel aktif ve sisteme giriş yapabilir'
                                : 'Personel pasif ve sisteme giriş yapamaz'}
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Warning Info */}
                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Kullanıcı, tedarikçi ve bölge ilişkileri oluşturulduktan sonra değiştirilemez.
                      Yeni bir ilişki oluşturmak için silip yeniden ekleyin.
                    </p>
                  </div>
                </>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'create' ? 'Ekle' : 'Güncelle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
