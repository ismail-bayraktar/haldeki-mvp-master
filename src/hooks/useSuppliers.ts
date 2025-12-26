import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmailService } from "./useEmailService";

export interface Supplier {
  id: string;
  user_id: string | null;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingSupplierInvite {
  id: string;
  email: string;
  supplier_data: {
    name: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export interface CreateSupplierInviteData {
  email: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface UpdateSupplierData {
  name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active?: boolean;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingSupplierInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendSupplierInvite } = useEmailService();

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Tedarikçiler yüklenirken hata oluştu');
    }
  }, []);

  const fetchPendingInvites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'supplier')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invites: PendingSupplierInvite[] = (data || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        supplier_data: inv.supplier_data as PendingSupplierInvite['supplier_data'],
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        used_at: inv.used_at,
      }));
      
      setPendingInvites(invites);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSuppliers(), fetchPendingInvites()]);
    setIsLoading(false);
  }, [fetchSuppliers, fetchPendingInvites]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createInvite = async (data: CreateSupplierInviteData): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Oturum bulunamadı');
        return false;
      }

      const { error } = await supabase
        .from('pending_invites')
        .insert({
          email: data.email,
          role: 'supplier',
          invited_by: userData.user.id,
          supplier_data: {
            name: data.name,
            contact_name: data.contact_name || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || data.email,
          },
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu email adresi için zaten bekleyen bir davet var');
        } else {
          throw error;
        }
        return false;
      }

      // Email gönder
      const emailResult = await sendSupplierInvite(
        data.email,
        data.name,
        data.contact_name || ''
      );
      
      if (emailResult.success) {
        toast.success('Tedarikçi daveti oluşturuldu ve email gönderildi');
      } else {
        toast.success('Tedarikçi daveti oluşturuldu (email gönderilemedi)');
        console.warn('Email sending failed:', emailResult.error);
      }
      
      await fetchPendingInvites();
      return true;
    } catch (error) {
      console.error('Error creating supplier invite:', error);
      toast.error('Davet oluşturulurken hata oluştu');
      return false;
    }
  };

  const updateSupplier = async (id: string, data: UpdateSupplierData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Tedarikçi güncellendi');
      await fetchSuppliers();
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Tedarikçi güncellenirken hata oluştu');
      return false;
    }
  };

  const toggleSupplierActive = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateSupplier(id, { is_active: !isActive });
  };

  const cancelInvite = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Davet iptal edildi');
      await fetchPendingInvites();
      return true;
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Davet iptal edilirken hata oluştu');
      return false;
    }
  };

  return {
    suppliers,
    pendingInvites,
    isLoading,
    fetchAll,
    createInvite,
    updateSupplier,
    toggleSupplierActive,
    cancelInvite,
  };
};
