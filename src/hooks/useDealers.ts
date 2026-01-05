import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  tax_number: string | null;
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

export interface CreateDirectDealerData {
  email: string;
  password: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids: string[];
  tax_number?: string;
  send_email?: boolean;
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
  const queryClient = useQueryClient();
  const { sendDealerInvite, sendApplicationApproved, sendApplicationRejected } = useEmailService();

  // Fetch all dealers with React Query
  const { data: dealers = [], isLoading: dealersLoading } = useQuery<Dealer[]>({
    queryKey: ['admin-dealers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending invites with React Query
  const { data: pendingInvites = [], isLoading: invitesLoading } = useQuery<PendingDealerInvite[]>({
    queryKey: ['admin-pending-dealer-invites'],
    queryFn: async () => {
      // 1. Get pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'dealer')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      if (!invitesData || invitesData.length === 0) return [];

      // 2. Get registered dealers for filtering
      const { data: dealersData, error: dealersError } = await supabase
        .from('dealers')
        .select('user_id, contact_email');

      if (dealersError) {
        console.error('Error fetching dealers for filtering:', dealersError);
        return invitesData.map(inv => ({
          id: inv.id,
          email: inv.email,
          dealer_data: inv.dealer_data as PendingDealerInvite['dealer_data'],
          expires_at: inv.expires_at,
          created_at: inv.created_at,
          used_at: inv.used_at,
        }));
      }

      // 3. Filter out already registered
      const registeredUserIds = new Set(
        (dealersData || [])
          .filter(d => d.user_id)
          .map(d => d.user_id)
      );

      const registeredEmails = new Set(
        (dealersData || [])
          .map(d => d.contact_email?.toLowerCase())
          .filter(Boolean)
      );

      const filteredData = invitesData.filter(inv => {
        const emailLower = inv.email.toLowerCase();
        if (registeredEmails.has(emailLower)) return false;
        if (inv.used_at) return false;
        return true;
      });

      return filteredData.map(inv => ({
        id: inv.id,
        email: inv.email,
        dealer_data: inv.dealer_data as PendingDealerInvite['dealer_data'],
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        used_at: inv.used_at,
      }));
    },
  });

  const isLoading = dealersLoading || invitesLoading;

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (data: CreateDealerInviteData): Promise<boolean> => {
      // Validation
      if (!data.email || !data.email.includes('@')) {
        toast.error('Geçerli bir email adresi giriniz');
        return false;
      }

      if (!data.name || data.name.trim().length === 0) {
        toast.error('Firma adı zorunludur');
        return false;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return false;
      }

      // Email kontrolü - zaten kayıtlı dealer var mı?
      const { data: existingDealer } = await supabase
        .from('dealers')
        .select('id, user_id, contact_email')
        .or(`contact_email.eq.${data.email.toLowerCase()},user_id.not.is.null`)
        .limit(1)
        .single();

      if (existingDealer && existingDealer.user_id) {
        toast.error('Bu email adresi ile zaten kayıtlı bir bayi var');
        return false;
      }

      // Pending invite kontrolü
      const { data: existingInvite } = await supabase
        .from('pending_invites')
        .select('id, email, used_at')
        .eq('email', data.email.toLowerCase())
        .eq('role', 'dealer')
        .is('used_at', null)
        .single();

      if (existingInvite) {
        toast.error('Bu email adresi için zaten bekleyen bir davet var');
        return false;
      }

      const { data: inviteData, error } = await supabase
        .from('pending_invites')
        .insert({
          email: data.email.toLowerCase().trim(),
          role: 'dealer',
          invited_by: userData.user.id,
          dealer_data: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
            region_ids: data.region_ids || [],
          },
        })
        .select('id')
        .single();

      if (error) {
        console.error('Create invite error details:', error);

        if (error.code === '23505') {
          toast.error('Bu email adresi için zaten bekleyen bir davet var');
        } else if (error.code === '42501') {
          toast.error('Bu işlem için yetkiniz yok. Lütfen admin olarak giriş yapın.');
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('RLS politikası hatası: Bu işlem için yetkiniz yok');
        } else if (error.message.includes('constraint')) {
          toast.error('Veri doğrulama hatası. Lütfen tüm alanları kontrol edin.');
        } else {
          toast.error(`Davet oluşturulurken hata oluştu: ${error.message}`);
        }
        return false;
      }

      if (!inviteData?.id) {
        toast.error('Davet oluşturuldu ancak ID alınamadı');
        return false;
      }

      // Email gönder
      const emailResult = await sendDealerInvite(
        data.email,
        data.name,
        data.contact_name || '',
        data.region_ids,
        inviteData.id
      );

      if (emailResult.success) {
        toast.success('Bayi daveti oluşturuldu ve email gönderildi');
      } else {
        toast.success('Bayi daveti oluşturuldu (email gönderilemedi)');
        console.warn('Email sending failed:', emailResult.error);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-dealer-invites'] });
    },
    onError: (error: Error) => {
      console.error('Error creating dealer invite:', error);
      toast.error(`Davet oluşturulurken hata oluştu: ${error.message}`);
    },
  });

  // Update dealer mutation
  const updateDealerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDealerData }): Promise<boolean> => {
      const { error } = await supabase
        .from('dealers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dealers'] });
      toast.success('Bayi güncellendi');
    },
    onError: (error: Error) => {
      console.error('Error updating dealer:', error);
      toast.error('Bayi güncellenirken hata oluştu');
    },
  });

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const { error: deleteError } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error details:', deleteError);

        if (deleteError.code === '42501') {
          toast.error('Bu işlem için yetkiniz yok. Lütfen admin olarak giriş yapın.');
        } else if (deleteError.code === 'PGRST301' || deleteError.message.includes('permission') || deleteError.message.includes('policy')) {
          toast.error('RLS politikası hatası: Bu işlem için yetkiniz yok');
        } else if (deleteError.code === 'PGRST116') {
          toast.error('Davet bulunamadı');
        } else {
          toast.error(`Davet iptal edilirken hata oluştu: ${deleteError.message || deleteError.code || 'Bilinmeyen hata'}`);
        }
        return false;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-dealer-invites'] });
      toast.success('Davet iptal edildi');
    },
    onError: (error: Error) => {
      console.error('Error canceling invite:', error);
      toast.error(`Davet iptal edilirken hata oluştu: ${error.message}`);
    },
  });

  // Approve dealer mutation
  const approveDealerMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }): Promise<boolean> => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('dealers')
        .update({
          approval_status: 'approved',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Get dealer info for email
      const dealer = dealers?.find(d => d.id === id);
      if (dealer?.contact_email && dealer?.contact_name) {
        await sendApplicationApproved(
          dealer.contact_email,
          dealer.contact_name,
          'dealer',
          dealer.name
        );
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dealers'] });
      toast.success('Bayi başvurusu onaylandı');
    },
    onError: (error: Error) => {
      console.error('Error approving dealer:', error);
      toast.error('Onaylama sırasında hata oluştu');
    },
  });

  // Reject dealer mutation
  const rejectDealerMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }): Promise<boolean> => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('dealers')
        .update({
          approval_status: 'rejected',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Get dealer info for email
      const dealer = dealers?.find(d => d.id === id);
      if (dealer?.contact_email && dealer?.contact_name) {
        await sendApplicationRejected(
          dealer.contact_email,
          dealer.contact_name,
          'dealer',
          dealer.name,
          notes
        );
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dealers'] });
      toast.success('Bayi başvurusu reddedildi');
    },
    onError: (error: Error) => {
      console.error('Error rejecting dealer:', error);
      toast.error('Reddetme sırasında hata oluştu');
    },
  });

  // Create direct dealer mutation
  const createDirectDealerMutation = useMutation({
    mutationFn: async (data: CreateDirectDealerData): Promise<{ success: boolean; userId?: string; password?: string }> => {
      // Validation
      if (!data.email || !data.email.includes('@')) {
        toast.error('Geçerli bir email adresi giriniz');
        return { success: false };
      }

      if (!data.password || data.password.length < 6) {
        toast.error('Şifre en az 6 karakter olmalıdır');
        return { success: false };
      }

      if (!data.name || data.name.trim().length === 0) {
        toast.error('Firma adı zorunludur');
        return { success: false };
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return { success: false };
      }

      // Check if user already exists
      const { data: existingDealerByEmail } = await supabase
        .from('dealers')
        .select('id, user_id, contact_email')
        .eq('contact_email', data.email.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (existingDealerByEmail && existingDealerByEmail.user_id) {
        toast.error('Bu email adresi ile zaten kayıtlı bir bayi var');
        return { success: false };
      }

      // Get session for Edge Function authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return { success: false };
      }

      // Call Edge Function to create user
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email.toLowerCase().trim(),
          password: data.password,
          role: 'dealer',
          dealerData: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
            region_ids: data.region_ids || [],
            tax_number: data.tax_number?.trim() || null,
          },
          sendEmail: data.send_email || false,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        console.error('Create user function error:', functionError);
        toast.error(`Kullanıcı oluşturulurken hata oluştu: ${functionError.message}`);
        return { success: false };
      }

      if (!functionData?.success) {
        toast.error(functionData?.error || 'Kullanıcı oluşturulamadı');
        return { success: false };
      }

      // Store password in localStorage
      if (functionData.userId && data.password) {
        const { storeTemporaryPassword } = await import('@/utils/passwordUtils');
        storeTemporaryPassword(functionData.userId, data.password);
      }

      return {
        success: true,
        userId: functionData.userId,
        password: data.password,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dealers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-dealer-invites'] });
      if (data.success) {
        toast.success('Bayi direkt kayıt edildi');
      }
    },
    onError: (error: Error) => {
      console.error('Error creating direct dealer:', error);
      toast.error(`Direkt kayıt sırasında hata oluştu: ${error.message}`);
    },
  });

  // Computed value for pending applications
  const pendingApplications = dealers?.filter(d => d.approval_status === 'pending') || [];

  return {
    dealers,
    pendingInvites,
    pendingApplications,
    isLoading,
    createInvite: (data: CreateDealerInviteData) => createInviteMutation.mutateAsync(data),
    createDirectDealer: (data: CreateDirectDealerData) => createDirectDealerMutation.mutateAsync(data),
    updateDealer: (id: string, data: UpdateDealerData) => updateDealerMutation.mutateAsync({ id, data }),
    toggleDealerActive: (id: string, isActive: boolean) => updateDealerMutation.mutateAsync({ id, data: { is_active: !isActive } }),
    cancelInvite: (id: string) => cancelInviteMutation.mutateAsync(id),
    approveDealer: (id: string, notes?: string) => approveDealerMutation.mutateAsync({ id, notes }),
    rejectDealer: (id: string, notes?: string) => rejectDealerMutation.mutateAsync({ id, notes }),
  };
};
