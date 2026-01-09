/**
 * Warehouse Staff Management Page
 * Phase 11 - Warehouse MVP
 *
 * Admin panel - Warehouse staff CRUD işlemleri
 * warehouse_staff tablosu yönetimi
 */

import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle, Users, Building2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  useWarehouseStaff,
  useCreateWarehouseStaff,
  useUpdateWarehouseStaff,
  useDeleteWarehouseStaff,
} from '@/hooks/useWarehouseStaff';
import type { WarehouseStaffWithDetails } from '@/hooks/useWarehouseStaff';
import { WarehouseStaffForm, type WarehouseStaffFormValues } from '@/components/admin/WarehouseStaffForm';
export default function WarehouseStaffPage() {
  const { isAdmin, isLoading: adminCheckLoading } = useIsAdmin();
  const { data: staffList, isLoading, error } = useWarehouseStaff();

  const { mutate: createStaff, isPending: isCreating } = useCreateWarehouseStaff();
  const { mutate: updateStaff, isPending: isUpdating } = useUpdateWarehouseStaff();
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteWarehouseStaff();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    staff: WarehouseStaffWithDetails | null;
  }>({
    open: false,
    staff: null,
  });

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    staff: WarehouseStaffWithDetails | null;
  }>({
    open: false,
    mode: 'create',
    staff: null,
  });

  // Yetki kontrolü
  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">Yetkisiz Erişim</p>
            <p className="text-sm text-muted-foreground mt-2">
              Bu sayfaya erişim için admin yetkisi gerekir
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Silme işlemi
  const handleDelete = () => {
    if (deleteDialog.staff) {
      deleteStaff(
        {
          user_id: deleteDialog.staff.user_id,
          vendor_id: deleteDialog.staff.vendor_id,
          warehouse_id: deleteDialog.staff.warehouse_id,
        },
        {
          onSuccess: () => {
            setDeleteDialog({ open: false, staff: null });
          },
        }
      );
    }
  };

  // Yeni personel ekle
  const handleCreate = () => {
    setFormDialog({ open: true, mode: 'create', staff: null });
  };

  // Personel düzenle
  const handleEdit = (staff: WarehouseStaffWithDetails) => {
    setFormDialog({
      open: true,
      mode: 'edit',
      staff,
    });
  };

  // Form submit
  const handleFormSubmit = (data: WarehouseStaffFormValues) => {
    if (formDialog.mode === 'create') {
      createStaff(data, {
        onSuccess: () => {
          setFormDialog({ open: false, mode: 'create', staff: null });
        },
      });
    } else if (formDialog.staff) {
      updateStaff(
        {
          user_id: formDialog.staff.user_id,
          vendor_id: formDialog.staff.vendor_id,
          warehouse_id: formDialog.staff.warehouse_id,
          is_active: data.is_active,
        },
        {
          onSuccess: () => {
            setFormDialog({ open: false, mode: 'create', staff: null });
          },
        }
      );
    }
  };

  // Durum toggle
  const handleToggleActive = (staff: WarehouseStaffWithDetails) => {
    updateStaff({
      user_id: staff.user_id,
      vendor_id: staff.vendor_id,
      warehouse_id: staff.warehouse_id,
      is_active: !staff.is_active,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Depo Personeli</h1>
              <p className="text-sm text-muted-foreground">
                Warehouse staff yetki yönetimi
                {staffList && staffList.length > 0 && (
                  <span className="ml-2">
                    (
                    {staffList.filter((s) => s.is_active).length} aktif / {staffList.length} toplam
                    )
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yeni Ekle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Veri yüklenirken hata oluştu</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            ) : !staffList || staffList.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Henüz personel eklenmemiş</p>
                <p className="text-sm text-muted-foreground mt-1">
                  İlk depo personelini eklemek için "Yeni Ekle" butonuna tıklayın
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          Tedarikçi
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Bölge
                        </div>
                      </TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff) => (
                      <TableRow
                        key={`${staff.user_id}-${staff.vendor_id}-${staff.warehouse_id}`}
                        className={!staff.is_active ? 'bg-muted/30' : undefined}
                      >
                        <TableCell className="font-medium">
                          {staff.user_full_name || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{staff.user_email || '-'}</span>
                        </TableCell>
                        <TableCell>{staff.vendor_name || '-'}</TableCell>
                        <TableCell>{staff.warehouse_name || '-'}</TableCell>
                        <TableCell>
                          {staff.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Pasif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(staff)}
                              title={staff.is_active ? 'Pasife al' : 'Aktife al'}
                            >
                              {staff.is_active ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(staff)}
                              title="Düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ open: true, staff })}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Personeli Sil</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteDialog.staff?.user_full_name || deleteDialog.staff?.user_email}" kişisini
                silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Edit Form Dialog */}
        <WarehouseStaffForm
          open={formDialog.open}
          onClose={() => setFormDialog((prev) => ({ ...prev, open: false }))}
          onSubmit={handleFormSubmit}
          isLoading={isCreating || isUpdating}
          initialData={
            formDialog.staff
              ? {
                  user_id: formDialog.staff.user_id,
                  vendor_id: formDialog.staff.vendor_id,
                  warehouse_id: formDialog.staff.warehouse_id,
                  is_active: formDialog.staff.is_active,
                }
              : undefined
          }
          mode={formDialog.mode}
        />
      </div>
    );
}
