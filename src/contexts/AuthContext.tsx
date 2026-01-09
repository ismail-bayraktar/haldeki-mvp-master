import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordChangeModal } from "@/components/auth/PasswordChangeModal";
import { normalizePhoneNumber } from "@/lib/phoneNormalizer";

type AppRole = 'superadmin' | 'admin' | 'dealer' | 'supplier' | 'business' | 'warehouse_manager' | 'user';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

interface WhitelistStatus {
  status: 'pending' | 'approved' | 'rejected' | 'duplicate' | null;
  applicationId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDealer: boolean;
  isSupplier: boolean;
  isBusiness: boolean;
  isWarehouseManager: boolean;
  roles: AppRole[];
  isRolesChecked: boolean;
  approvalStatus: ApprovalStatus;
  isApprovalChecked: boolean;
  isAuthDrawerOpen: boolean;
  mustChangePassword: boolean;
  openAuthDrawer: () => void;
  closeAuthDrawer: () => void;
  hasRole: (role: AppRole) => boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null; redirectPath?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isRolesChecked, setIsRolesChecked] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [isApprovalChecked, setIsApprovalChecked] = useState(false);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Derived role states
  const isSuperAdmin = roles.includes('superadmin');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isDealer = roles.includes('dealer');
  const isSupplier = roles.includes('supplier');
  const isBusiness = roles.includes('business');
  const isWarehouseManager = roles.includes('warehouse_manager');

  const hasRole = (role: AppRole): boolean => {
    if (role === 'admin') {
      return roles.includes('admin') || roles.includes('superadmin');
    }
    return roles.includes(role);
  };

  const checkApprovalStatus = useCallback(async (userId: string, userRoles: AppRole[]) => {
    try {
      // Only check for dealers, suppliers, and businesses
      if (userRoles.includes('dealer')) {
        const { data } = await supabase
          .from('dealers')
          .select('approval_status')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          setApprovalStatus(data.approval_status as ApprovalStatus);
        }
      } else if (userRoles.includes('supplier')) {
        const { data } = await supabase
          .from('suppliers')
          .select('approval_status')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          setApprovalStatus(data.approval_status as ApprovalStatus);
        }
      } else if (userRoles.includes('business')) {
        const { data } = await supabase
          .from('businesses')
          .select('approval_status')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          setApprovalStatus(data.approval_status as ApprovalStatus);
        }
      } else {
        // Not a dealer, supplier or business, no approval needed
        setApprovalStatus(null);
      }
    } catch (e) {
      console.error('Approval status check error:', e);
      setApprovalStatus(null);
    } finally {
      setIsApprovalChecked(true);
    }
  }, []);

  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const userRoles = !error && data ? data.map(r => r.role as AppRole) : [];
      setRoles(userRoles);
      
      // After setting roles, check approval status
      await checkApprovalStatus(userId, userRoles);
    } catch (e) {
      console.error('Roles check error:', e);
      setRoles([]);
      setIsApprovalChecked(true);
    } finally {
      setIsRolesChecked(true);
    }
  }, [checkApprovalStatus]);

  const checkMustChangePassword = (user: User) => {
    const mustChange = user.user_metadata?.must_change_password === true;
    setMustChangePassword(mustChange);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkMustChangePassword(session.user);

          // Only reset roles on actual auth changes, not token refresh
          // TOKEN_REFRESHED fires on tab visibility change - don't reset roles
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // Don't set isRolesChecked=false first to prevent race condition
            // Let checkUserRoles handle its own state properly
            checkUserRoles(session.user.id);
          } else if (event === 'TOKEN_REFRESHED' && !isRolesChecked) {
            // Edge case recovery: only refresh if roles never loaded
            checkUserRoles(session.user.id);
          }
        } else {
          setRoles([]);
          setIsRolesChecked(true);
          setApprovalStatus(null);
          setIsApprovalChecked(true);
          setMustChangePassword(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkMustChangePassword(session.user);
        checkUserRoles(session.user.id);
      } else {
        setIsRolesChecked(true);
        setMustChangePassword(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRoles, isRolesChecked]);

  const openAuthDrawer = () => setIsAuthDrawerOpen(true);
  const closeAuthDrawer = () => setIsAuthDrawerOpen(false);

  // Check whitelist status by phone number
  const checkWhitelistStatus = async (phone: string): Promise<WhitelistStatus> => {
    try {
      // Normalize phone number for consistent matching
      const normalizedPhone = normalizePhoneNumber(phone);

      if (!normalizedPhone) {
        console.warn('Could not normalize phone number:', phone);
        return { status: null, applicationId: null };
      }

      const { data, error } = await supabase
        .from('whitelist_applications')
        .select('id, status')
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { status: null, applicationId: null };
      }

      return {
        status: data.status,
        applicationId: data.id
      };
    } catch (error) {
      console.error('Error checking whitelist status:', error);
      return { status: null, applicationId: null };
    }
  };

  // Helper: Get redirect path based on user roles
  const getRedirectPathForRole = (userRoles: AppRole[]): string => {
    // Priority: admin > warehouse > supplier > dealer > business > customer
    if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
      return '/admin';
    }
    if (userRoles.includes('warehouse_manager')) {
      return '/depo';
    }
    if (userRoles.includes('supplier')) {
      return '/tedarikci';
    }
    if (userRoles.includes('dealer')) {
      return '/bayi';
    }
    if (userRoles.includes('business')) {
      return '/isletme';
    }
    return '/'; // Customer (user role) → landing page
  };

  const login = async (email: string, password: string): Promise<{ error: Error | null; redirectPath?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email veya şifre hatalı');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success('Giriş başarılı!');
      closeAuthDrawer();

      // Wait for roles to load with timeout protection
      await new Promise<void>((resolve) => {
        const maxWaitTime = 3000; // 3 seconds max wait
        const startTime = Date.now();

        const checkInterval = setInterval(() => {
          if (isRolesChecked || (Date.now() - startTime) >= maxWaitTime) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      });

      // Re-fetch user roles after login to ensure fresh data
      if (data.user?.id) {
        await checkUserRoles(data.user.id);
      }

      // Get user phone from profiles table for whitelist check
      let userPhone: string | null = null;
      let whitelistStatus: WhitelistStatus = { status: null, applicationId: null };

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', data.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user phone:', error);
          // Non-fatal: continue without phone number
          userPhone = null;
        } else {
          userPhone = profile?.phone || null;
        }
      } catch (error) {
        console.error('Error fetching user phone:', error);
        // Non-fatal: continue without phone number
        userPhone = null;
      }

      // Business users require phone number for whitelist
      if (!userPhone && roles.includes('business')) {
        toast.error('Telefon numaranız profil bilgilerinizde eksik. Lütfen iletişime geçin.');
        await supabase.auth.signOut();
        return { error: new Error('Phone number required for business users') };
      }

      if (userPhone) {
        whitelistStatus = await checkWhitelistStatus(userPhone);
      }

      // Handle whitelist status
      if (whitelistStatus.status === 'pending') {
        return { error: null, redirectPath: '/beklemede' };
      }

      if (whitelistStatus.status === 'rejected' || whitelistStatus.status === 'duplicate') {
        const message = whitelistStatus.status === 'rejected'
          ? 'Başvurunuz reddedildi. Detaylar için iletişime geçin.'
          : 'Bu telefon numarası için zaten bir başvuru mevcut.';
        toast.error(message);
        await supabase.auth.signOut();
        return { error: new Error(message) };
      }

      // Approved or no whitelist record → normal role-based redirect
      const redirectPath = getRedirectPathForRole(roles);
      return { error: null, redirectPath };
    } catch (e) {
      const error = e as Error;
      toast.error('Bir hata oluştu');
      return { error };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: name }
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Bu email adresi zaten kayıtlı');
        } else {
          toast.error(error.message);
        }
        return { error };
      }
      
      toast.success('Hesap başarıyla oluşturuldu!');
      closeAuthDrawer();
      return { error: null };
    } catch (e) {
      const error = e as Error;
      toast.error('Bir hata oluştu');
      return { error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setIsRolesChecked(true);
    setApprovalStatus(null);
    setIsApprovalChecked(true);
    setMustChangePassword(false);
    toast.success('Çıkış yapıldı');
  };

  const handlePasswordChangeSuccess = async () => {
    // Update user metadata to clear flag
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          must_change_password: false,
        },
      });
      if (!error) {
        setMustChangePassword(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isDealer,
        isSupplier,
        isBusiness,
        isWarehouseManager,
        roles,
        isRolesChecked,
        approvalStatus,
        isApprovalChecked,
        isAuthDrawerOpen,
        mustChangePassword,
        openAuthDrawer,
        closeAuthDrawer,
        hasRole,
        login,
        signup,
        logout,
      }}
    >
      {children}
      {mustChangePassword && user && (
        <PasswordChangeModal
          open={mustChangePassword}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
