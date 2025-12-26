import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmailService } from "./useEmailService";

export interface Dealer {
  id: string;
  user_id: string | null;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  region_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingDealerInvite {
  id: string;
  email: string;
  dealer_data: {
    name: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    region_ids?: string[];
  };
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export interface CreateDealerInviteData {
  email: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids?: string[];
}

export interface UpdateDealerData {
  name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids?: string[];
  is_active?: boolean;
}

export const useDealers = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingDealerInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendDealerInvite } = useEmailService();

  const fetchDealers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDealers(data || []);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      toast.error('Bayiler yüklenirken hata oluştu');
    }
  }, []);

  const fetchPendingInvites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'dealer')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invites: PendingDealerInvite[] = (data || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        dealer_data: inv.dealer_data as PendingDealerInvite['dealer_data'],
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
    await Promise.all([fetchDealers(), fetchPendingInvites()]);
    setIsLoading(false);
  }, [fetchDealers, fetchPendingInvites]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createInvite = async (data: CreateDealerInviteData): Promise<boolean> => {
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
          role: 'dealer',
          invited_by: userData.user.id,
          dealer_data: {
            name: data.name,
            contact_name: data.contact_name || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || data.email,
            region_ids: data.region_ids || [],
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
      const emailResult = await sendDealerInvite(
        data.email,
        data.name,
        data.contact_name || '',
        data.region_ids
      );
      
      if (emailResult.success) {
        toast.success('Bayi daveti oluşturuldu ve email gönderildi');
      } else {
        toast.success('Bayi daveti oluşturuldu (email gönderilemedi)');
        console.warn('Email sending failed:', emailResult.error);
      }
      
      await fetchPendingInvites();
      return true;
    } catch (error) {
      console.error('Error creating dealer invite:', error);
      toast.error('Davet oluşturulurken hata oluştu');
      return false;
    }
  };

  const updateDealer = async (id: string, data: UpdateDealerData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dealers')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Bayi güncellendi');
      await fetchDealers();
      return true;
    } catch (error) {
      console.error('Error updating dealer:', error);
      toast.error('Bayi güncellenirken hata oluştu');
      return false;
    }
  };

  const toggleDealerActive = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateDealer(id, { is_active: !isActive });
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
    dealers,
    pendingInvites,
    isLoading,
    fetchAll,
    createInvite,
    updateDealer,
    toggleDealerActive,
    cancelInvite,
  };
};
