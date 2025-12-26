import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = 'superadmin' | 'admin' | 'dealer' | 'supplier' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDealer: boolean;
  isSupplier: boolean;
  roles: AppRole[];
  isRolesChecked: boolean;
  isAuthDrawerOpen: boolean;
  openAuthDrawer: () => void;
  closeAuthDrawer: () => void;
  hasRole: (role: AppRole) => boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
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
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);

  // Derived role states
  const isSuperAdmin = roles.includes('superadmin');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isDealer = roles.includes('dealer');
  const isSupplier = roles.includes('supplier');

  const hasRole = (role: AppRole): boolean => {
    if (role === 'admin') {
      return roles.includes('admin') || roles.includes('superadmin');
    }
    return roles.includes(role);
  };

  const checkUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (!error && data) {
        setRoles(data.map(r => r.role as AppRole));
      } else {
        setRoles([]);
      }
    } catch (e) {
      console.error('Roles check error:', e);
      setRoles([]);
    } finally {
      setIsRolesChecked(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setIsRolesChecked(false);
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setIsRolesChecked(true);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoles(session.user.id);
      } else {
        setIsRolesChecked(true);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthDrawer = () => setIsAuthDrawerOpen(true);
  const closeAuthDrawer = () => setIsAuthDrawerOpen(false);

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
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
      return { error: null };
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
    toast.success('Çıkış yapıldı');
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
        roles,
        isRolesChecked,
        isAuthDrawerOpen,
        openAuthDrawer,
        closeAuthDrawer,
        hasRole,
        login,
        signup,
        logout,
      }}
    >
      {children}
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
