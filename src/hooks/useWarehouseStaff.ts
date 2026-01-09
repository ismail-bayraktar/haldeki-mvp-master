/**
 * Warehouse Staff Hook
 * Phase 11 - Warehouse MVP
 *
 * Admin panel için warehouse_staff CRUD işlemleri
 * Tablo: warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WarehouseStaff {
  user_id: string;
  vendor_id: string;
  warehouse_id: string;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseStaffWithDetails extends WarehouseStaff {
  user_email?: string;
  user_full_name?: string;
  vendor_name?: string;
  warehouse_name?: string;
}

/**
 * Hook: Tüm warehouse_staff kayıtlarını getirir (Admin only)
 *
 * FIX: warehouse_staff.user_id → auth.users(id), NOT profiles.id
 * So we fetch warehouse_staff first, then separately query profiles by id
 */
export function useWarehouseStaff() {
  return useQuery({
    queryKey: ['warehouse-staff'],
    queryFn: async () => {
      // Step 1: Fetch warehouse_staff with vendors and regions
      const { data: staffData, error: staffError } = await supabase
        .from('warehouse_staff')
        .select(`
          user_id,
          vendor_id,
          warehouse_id,
          is_active,
          created_at,
          vendors (
            id,
            name
          ),
          regions (
            id,
            name
          )
        `);

      if (staffError) throw staffError;
      if (!staffData || staffData.length === 0) return [];

      // Step 2: Fetch profiles for all user_ids
      // warehouse_staff.user_id references auth.users(id), which equals profiles.id
      const userIds = staffData.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Step 3: Create a map for quick lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, { email: p.email, full_name: p.full_name }])
      );

      // Step 4: Merge data
      return staffData.map((staff: Record<string, unknown>) => ({
        ...staff,
        user_email: profileMap.get(staff.user_id as string)?.email,
        user_full_name: profileMap.get(staff.user_id as string)?.full_name,
        vendor_name: (staff.vendors as Record<string, unknown> | null)?.name,
        warehouse_name: (staff.regions as Record<string, unknown> | null)?.name,
      })) as WarehouseStaffWithDetails[];
    },
    staleTime: 2 * 60 * 1000, // 2 dakika cache
  });
}

/**
 * Helper: Check if user is already assigned to vendor
 * Prevents duplicate assignments
 */
async function checkDuplicateAssignment(
  userId: string,
  vendorId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('warehouse_staff')
    .select('user_id, vendor_id')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (error) {
    console.error('Duplicate check error:', error);
    return false; // On error, allow insert (fail open)
  }

  return !!data; // Returns true if duplicate exists
}

/**
 * Hook: Yeni warehouse staff oluşturur (Admin only)
 *
 * Includes duplicate prevention: Checks if user is already assigned to vendor
 */
export function useCreateWarehouseStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: {
      user_id: string;
      vendor_id: string;
      warehouse_id: string;
    }) => {
      // Duplicate check
      const isDuplicate = await checkDuplicateAssignment(staff.user_id, staff.vendor_id);
      if (isDuplicate) {
        throw new Error('Bu kullanıcı zaten bu tedarikçiye atanmış. Lütfen başka bir kullanıcı veya tedarikçi seçin.');
      }

      const { data, error } = await supabase
        .from('warehouse_staff')
        .insert({
          user_id: staff.user_id,
          vendor_id: staff.vendor_id,
          warehouse_id: staff.warehouse_id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Depo personeli eklendi');
      queryClient.invalidateQueries({ queryKey: ['warehouse-staff'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook: Warehouse staff durumunu günceller (Admin only)
 */
export function useUpdateWarehouseStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: {
      user_id: string;
      vendor_id: string;
      warehouse_id: string;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from('warehouse_staff')
        .update({
          is_active: staff.is_active,
        })
        .eq('user_id', staff.user_id)
        .eq('vendor_id', staff.vendor_id)
        .eq('warehouse_id', staff.warehouse_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Depo personeli güncellendi');
      queryClient.invalidateQueries({ queryKey: ['warehouse-staff'] });
    },
    onError: (error: Error) => {
      toast.error('Hata: ' + error.message);
    },
  });
}

/**
 * Hook: Warehouse staff siler (Admin only)
 */
export function useDeleteWarehouseStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: {
      user_id: string;
      vendor_id: string;
      warehouse_id: string;
    }) => {
      const { error } = await supabase
        .from('warehouse_staff')
        .delete()
        .eq('user_id', staff.user_id)
        .eq('vendor_id', staff.vendor_id)
        .eq('warehouse_id', staff.warehouse_id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Depo personeli silindi');
      queryClient.invalidateQueries({ queryKey: ['warehouse-staff'] });
    },
    onError: (error: Error) => {
      toast.error('Hata: ' + error.message);
    },
  });
}

/**
 * Hook: Kullanıcının warehouse staff olup olmadığını kontrol eder
 */
export function useIsWarehouseStaff() {
  return useQuery({
    queryKey: ['is-warehouse-staff'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('warehouse_staff')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });
}
