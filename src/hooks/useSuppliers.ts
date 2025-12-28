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
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  product_categories: string[] | null;
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

export interface CreateDirectSupplierData {
  email: string;
  password: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  product_categories?: string[];
  send_email?: boolean;
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
  const { sendSupplierInvite, sendApplicationApproved, sendApplicationRejected } = useEmailService();

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
      // 1. pending_invites'ları al - used_at IS NULL kontrolü zaten query'de var
      const { data: invitesData, error: invitesError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('role', 'supplier')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      if (!invitesData || invitesData.length === 0) {
        setPendingInvites([]);
        return;
      }

      // 2. Kayıtlı supplier'ları al (user_id ile)
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('user_id, contact_email');
      
      if (suppliersError) {
        console.error('Error fetching suppliers for filtering:', suppliersError);
        // Continue with invites even if suppliers fetch fails
      }

      // 3. Filtreleme: used_at zaten NULL, şimdi user_id ve email kontrolü
      // user_id varsa, o supplier zaten kayıt olmuş demektir
      const registeredUserIds = new Set(
        (suppliersData || [])
          .filter(s => s.user_id)
          .map(s => s.user_id)
      );

      // Email kontrolü - suppliers tablosundaki contact_email'ler
      const registeredEmails = new Set(
        (suppliersData || [])
          .map(s => s.contact_email?.toLowerCase())
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
      
      const invites: PendingSupplierInvite[] = filteredData.map(inv => ({
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
      toast.error('Bekleyen davetler yüklenirken hata oluştu');
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

      // Email kontrolü - zaten kayıtlı supplier var mı?
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id, user_id, contact_email')
        .or(`contact_email.eq.${data.email.toLowerCase()},user_id.not.is.null`)
        .limit(1)
        .single();

      if (existingSupplier && existingSupplier.user_id) {
        toast.error('Bu email adresi ile zaten kayıtlı bir tedarikçi var');
        return false;
      }

      // Pending invite kontrolü
      const { data: existingInvite } = await supabase
        .from('pending_invites')
        .select('id, email, used_at')
        .eq('email', data.email.toLowerCase())
        .eq('role', 'supplier')
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
          role: 'supplier',
          invited_by: userData.user.id,
          supplier_data: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
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
      const emailResult = await sendSupplierInvite(
        data.email,
        data.name,
        data.contact_name || '',
        inviteData.id
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
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Davet oluşturulurken hata oluştu: ${errorMessage}`);
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

  const approveSupplier = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suppliers')
        .update({
          approval_status: 'approved',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Get supplier info for email
      const supplier = suppliers.find(s => s.id === id);
      if (supplier?.contact_email && supplier?.contact_name) {
        await sendApplicationApproved(
          supplier.contact_email,
          supplier.contact_name,
          'supplier',
          supplier.name
        );
      }

      toast.success('Tedarikçi başvurusu onaylandı');
      await fetchSuppliers();
      return true;
    } catch (error) {
      console.error('Error approving supplier:', error);
      toast.error('Onaylama sırasında hata oluştu');
      return false;
    }
  };

  const rejectSupplier = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suppliers')
        .update({
          approval_status: 'rejected',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Get supplier info for email
      const supplier = suppliers.find(s => s.id === id);
      if (supplier?.contact_email && supplier?.contact_name) {
        await sendApplicationRejected(
          supplier.contact_email,
          supplier.contact_name,
          'supplier',
          supplier.name,
          notes
        );
      }

      toast.success('Tedarikçi başvurusu reddedildi');
      await fetchSuppliers();
      return true;
    } catch (error) {
      console.error('Error rejecting supplier:', error);
      toast.error('Reddetme sırasında hata oluştu');
      return false;
    }
  };

  const createDirectSupplier = async (data: CreateDirectSupplierData): Promise<{ success: boolean; userId?: string; password?: string }> => {
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
      const { data: existingSupplierByEmail } = await supabase
        .from('suppliers')
        .select('id, user_id, contact_email')
        .eq('contact_email', data.email.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (existingSupplierByEmail && existingSupplierByEmail.user_id) {
        toast.error('Bu email adresi ile zaten kayıtlı bir tedarikçi var');
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
          role: 'supplier',
          supplierData: {
            name: data.name.trim(),
            contact_name: data.contact_name?.trim() || '',
            contact_phone: data.contact_phone?.trim() || '',
            contact_email: (data.contact_email || data.email).toLowerCase().trim(),
            product_categories: data.product_categories || [],
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

      toast.success('Tedarikçi direkt kayıt edildi');
      
      // Store password in localStorage for later viewing
      if (functionData.userId && data.password) {
        const { storeTemporaryPassword } = await import('@/utils/passwordUtils');
        storeTemporaryPassword(functionData.userId, data.password);
      }
      
      await fetchSuppliers();
      await fetchPendingInvites();

      return {
        success: true,
        userId: functionData.userId,
        password: data.password, // Return password for display
      };
    } catch (error) {
      console.error('Error creating direct supplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Direkt kayıt sırasında hata oluştu: ${errorMessage}`);
      return { success: false };
    }
  };

  // Filter pending applications
  const pendingApplications = suppliers.filter(s => s.approval_status === 'pending');

  return {
    suppliers,
    pendingInvites,
    pendingApplications,
    isLoading,
    fetchAll,
    createInvite,
    createDirectSupplier,
    updateSupplier,
    toggleSupplierActive,
    cancelInvite,
    approveSupplier,
    rejectSupplier,
  };
};
