import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmailService } from "./useEmailService";

export interface Business {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_type: string | null;
  region_ids: string[];
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingBusinessInvite {
  id: string;
  email: string;
  business_data: {
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

export interface CreateBusinessInviteData {
  email: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids?: string[];
}

export interface CreateDirectBusinessData {
  email: string;
  password: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids: string[];
  tax_number?: string;
  business_type?: string;
  send_email?: boolean;
}

export const useBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingBusinessInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendEmail, sendBusinessInvite, sendApplicationApproved, sendApplicationRejected } = useEmailService();

  const fetchBusinesses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses((data as unknown as Business[]) || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('İşletmeler yüklenirken hata oluştu');
    }
  }, []);

  const fetchPendingInvites = useCallback(async () => {
    try {
      const { data: invitesData, error: invitesError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'business')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      
      const invites: PendingBusinessInvite[] = (invitesData || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        business_data: (inv.business_data || inv.dealer_data) as unknown as PendingBusinessInvite['business_data'], // Fallback to dealer_data for legacy
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
    await Promise.all([fetchBusinesses(), fetchPendingInvites()]);
    setIsLoading(false);
  }, [fetchBusinesses, fetchPendingInvites]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createBusinessInvite = async (data: CreateBusinessInviteData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user");

      const { data: invite, error } = await supabase
        .from('pending_invites')
        .insert({
          email: data.email.toLowerCase().trim(),
          role: 'business',
          invited_by: userData.user.id,
          business_data: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
            region_ids: data.region_ids || [],
          }
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bu email adresi için zaten aktif bir davet bulunuyor.');
        }
        throw error;
      }

      // Use the dedicated business invite function
      await sendBusinessInvite(
        data.email,
        data.name,
        data.contact_name || 'İşletme Yetkilisi',
        invite.id
      );

      toast.success('İşletme daveti gönderildi');
      await fetchPendingInvites();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating business invite:', error);
      toast.error(error.message || 'Davet gönderilirken hata oluştu');
      return { success: false };
    }
  };

  const approveBusiness = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: businessData, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('businesses')
        .update({
          approval_status: 'approved',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Send approval email
      if (businessData.contact_email) {
        await sendApplicationApproved(
          businessData.contact_email,
          businessData.contact_name || 'İşletme Yetkilisi',
          'business',
          businessData.company_name
        );
      }

      toast.success('İşletme başvurusu onaylandı');
      await fetchBusinesses();
      return true;
    } catch (error) {
      console.error('Error approving business:', error);
      toast.error('Onaylama sırasında hata oluştu');
      return false;
    }
  };

  const rejectBusiness = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: businessData, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('businesses')
        .update({
          approval_status: 'rejected',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Send rejection email
      if (businessData.contact_email) {
        await sendApplicationRejected(
          businessData.contact_email,
          businessData.contact_name || 'İşletme Yetkilisi',
          'business',
          businessData.company_name,
          notes
        );
      }

      toast.success('İşletme başvurusu reddedildi');
      await fetchBusinesses();
      return true;
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error('Reddetme sırasında hata oluştu');
      return false;
    }
  };

  const createDirectBusiness = async (data: CreateDirectBusinessData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email.toLowerCase().trim(),
          password: data.password,
          role: 'business',
          businessData: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
            region_ids: data.region_ids || [],
            tax_number: data.tax_number?.trim() || null,
            business_type: data.business_type || null,
          },
          sendEmail: data.send_email || false,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) throw functionError;
      if (!functionData?.success) throw new Error(functionData?.error || 'Kullanıcı oluşturulamadı');

      toast.success('İşletme direkt kayıt edildi');
      
      if (functionData.userId && data.password) {
        const { storeTemporaryPassword } = await import('@/utils/passwordUtils');
        storeTemporaryPassword(functionData.userId, data.password);
      }
      
      await fetchAll();
      return { success: true, userId: functionData.userId };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error creating direct business:', err);
      toast.error(`Direkt kayıt sırasında hata oluştu: ${err.message}`);
      return { success: false };
    }
  };

  const pendingApplications = businesses.filter(b => b.approval_status === 'pending');

  return {
    businesses,
    pendingInvites,
    pendingApplications,
    isLoading,
    fetchAll,
    approveBusiness,
    rejectBusiness,
    createDirectBusiness
  };
};
