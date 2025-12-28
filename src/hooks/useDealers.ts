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
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingDealerInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendDealerInvite, sendApplicationApproved, sendApplicationRejected } = useEmailService();

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
      // 1. pending_invites'ları al - used_at IS NULL kontrolü zaten query'de var
      const { data: invitesData, error: invitesError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'dealer')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      if (!invitesData || invitesData.length === 0) {
        setPendingInvites([]);
        return;
      }

      // 2. Kayıtlı dealer'ları al (user_id ile)
      const { data: dealersData, error: dealersError } = await supabase
        .from('dealers')
        .select('user_id, contact_email');
      
      if (dealersError) {
        console.error('Error fetching dealers for filtering:', dealersError);
        // Continue with invites even if dealers fetch fails
      }

      // 3. Filtreleme: used_at zaten NULL, şimdi user_id ve email kontrolü
      // user_id varsa, o dealer zaten kayıt olmuş demektir
      const registeredUserIds = new Set(
        (dealersData || [])
          .filter(d => d.user_id)
          .map(d => d.user_id)
      );

      // Email kontrolü - dealers tablosundaki contact_email'ler
      const registeredEmails = new Set(
        (dealersData || [])
          .map(d => d.contact_email?.toLowerCase())
          .filter(Boolean)
      );
      
      // Kayıtlı olanları filtrele
      const filteredData = (invitesData || []).filter(inv => {
        const emailLower = inv.email.toLowerCase();
        // Email ile kayıtlı kullanıcı var mı kontrol et
        if (registeredEmails.has(emailLower)) {
          return false;
        }
        // used_at kontrolü zaten query'de yapılıyor ama double-check
        if (inv.used_at) {
          return false;
        }
        return true;
      });
      
      const invites: PendingDealerInvite[] = filteredData.map(inv => ({
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
      toast.error('Bekleyen davetler yüklenirken hata oluştu');
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
        
        // Spesifik hata mesajları
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

      // Email gönder - invite ID ile özel kayıt sayfasına yönlendir
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
      
      await fetchPendingInvites();
      return true;
    } catch (error) {
      console.error('Error creating dealer invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Davet oluşturulurken hata oluştu: ${errorMessage}`);
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
      // Önce daveti kontrol et
      const { data: inviteData, error: checkError } = await supabase
        .from('pending_invites')
        .select('id, email, role')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Error checking invite:', checkError);
        if (checkError.code === 'PGRST116') {
          toast.error('Davet bulunamadı');
        } else {
          toast.error('Davet kontrol edilirken hata oluştu');
        }
        return false;
      }

      if (!inviteData) {
        toast.error('Davet bulunamadı');
        return false;
      }

      // RLS kontrolü - admin yetkisi kontrolü için auth kontrolü
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Oturum bulunamadı');
        return false;
      }

      // DELETE işlemi - select olmadan yap (RLS select'i engelliyor olabilir)
      const { error: deleteError } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error details:', deleteError);
        console.error('Delete error code:', deleteError.code);
        console.error('Delete error message:', deleteError.message);
        console.error('Delete error details:', deleteError.details);
        console.error('Delete error hint:', deleteError.hint);
        
        // Spesifik hata mesajları
        if (deleteError.code === '42501') {
          toast.error('Bu işlem için yetkiniz yok. Lütfen admin olarak giriş yapın.');
        } else if (deleteError.code === 'PGRST301' || deleteError.message.includes('permission') || deleteError.message.includes('policy')) {
          toast.error('RLS politikası hatası: Bu işlem için yetkiniz yok');
        } else if (deleteError.code === 'PGRST116') {
          toast.error('Davet bulunamadı');
          await fetchPendingInvites(); // Listeyi güncelle
        } else {
          toast.error(`Davet iptal edilirken hata oluştu: ${deleteError.message || deleteError.code || 'Bilinmeyen hata'}`);
        }
        return false;
      }

      // DELETE başarılı, listeyi güncelle
      await fetchPendingInvites();

      toast.success('Davet iptal edildi');
      await fetchPendingInvites();
      return true;
    } catch (error) {
      console.error('Error canceling invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Davet iptal edilirken hata oluştu: ${errorMessage}`);
      return false;
    }
  };

  const approveDealer = async (id: string, notes?: string): Promise<boolean> => {
    try {
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
      const dealer = dealers.find(d => d.id === id);
      if (dealer?.contact_email && dealer?.contact_name) {
        await sendApplicationApproved(
          dealer.contact_email,
          dealer.contact_name,
          'dealer',
          dealer.name
        );
      }

      toast.success('Bayi başvurusu onaylandı');
      await fetchDealers();
      return true;
    } catch (error) {
      console.error('Error approving dealer:', error);
      toast.error('Onaylama sırasında hata oluştu');
      return false;
    }
  };

  const rejectDealer = async (id: string, notes?: string): Promise<boolean> => {
    try {
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
      const dealer = dealers.find(d => d.id === id);
      if (dealer?.contact_email && dealer?.contact_name) {
        await sendApplicationRejected(
          dealer.contact_email,
          dealer.contact_name,
          'dealer',
          dealer.name,
          notes
        );
      }

      toast.success('Bayi başvurusu reddedildi');
      await fetchDealers();
      return true;
    } catch (error) {
      console.error('Error rejecting dealer:', error);
      toast.error('Reddetme sırasında hata oluştu');
      return false;
    }
  };

  const createDirectDealer = async (data: CreateDirectDealerData): Promise<{ success: boolean; userId?: string; password?: string }> => {
    try {
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

      // Check if user already exists - check by email first
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
      // Manually add Authorization header to ensure it's sent
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

      toast.success('Bayi direkt kayıt edildi');
      
      // Store password in localStorage for later viewing
      if (functionData.userId && data.password) {
        const { storeTemporaryPassword } = await import('@/utils/passwordUtils');
        storeTemporaryPassword(functionData.userId, data.password);
      }
      
      await fetchDealers();
      await fetchPendingInvites();

      return {
        success: true,
        userId: functionData.userId,
        password: data.password, // Return password for display
      };
    } catch (error) {
      console.error('Error creating direct dealer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Direkt kayıt sırasında hata oluştu: ${errorMessage}`);
      return { success: false };
    }
  };

  // Filter pending applications
  const pendingApplications = dealers.filter(d => d.approval_status === 'pending');

  return {
    dealers,
    pendingInvites,
    pendingApplications,
    isLoading,
    fetchAll,
    createInvite,
    createDirectDealer,
    updateDealer,
    toggleDealerActive,
    cancelInvite,
    approveDealer,
    rejectDealer,
  };
};
