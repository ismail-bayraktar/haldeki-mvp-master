import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Shield,
  Truck,
  Package,
  Building,
  User,
  Clock,
  CheckCircle,
  LogOut,
  ChevronsUpDown,
  FlaskConical,
  Warehouse
} from 'lucide-react';

// SECURITY: RoleSwitcher is development-only and must NOT be included in production builds
// This component contains hardcoded test credentials and allows role switching
// In production, it returns null to completely remove it from the DOM
const PROD_CHECK = import.meta.env.PROD;

interface TestAccount {
  id: string;
  email: string;
  role: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  redirectPath: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'superadmin',
    email: import.meta.env.VITE_TEST_ADMIN_EMAIL || 'superadmin@test.haldeki.com',
    role: 'superadmin',
    label: 'Superadmin',
    icon: <ShieldAlert className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    redirectPath: '/admin'
  },
  {
    id: 'admin',
    email: import.meta.env.VITE_TEST_ADMIN2_EMAIL || 'admin@test.haldeki.com',
    role: 'admin',
    label: 'Admin',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
    redirectPath: '/admin'
  },
  {
    id: 'dealer-approved',
    email: import.meta.env.VITE_TEST_DEALER_EMAIL || 'dealer-approved@test.haldeki.com',
    role: 'dealer',
    label: 'Bayi',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    redirectPath: '/bayi'
  },
  {
    id: 'dealer-pending',
    email: import.meta.env.VITE_TEST_DEALER_PENDING_EMAIL || 'dealer-pending@test.haldeki.com',
    role: 'dealer',
    label: 'Bayi (Bekliyor)',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
    redirectPath: '/bekleyen'
  },
  {
    id: 'supplier-approved',
    email: import.meta.env.VITE_TEST_SUPPLIER_EMAIL || 'supplier-approved@test.haldeki.com',
    role: 'supplier',
    label: 'Tedarikçi',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
    redirectPath: '/tedarikci'
  },
  {
    id: 'supplier-pending',
    email: import.meta.env.VITE_TEST_SUPPLIER_PENDING_EMAIL || 'supplier-pending@test.haldeki.com',
    role: 'supplier',
    label: 'Tedarikçi (Bekliyor)',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
    redirectPath: '/bekleyen'
  },
  {
    id: 'business-approved',
    email: import.meta.env.VITE_TEST_BUSINESS_EMAIL || 'business-approved@test.haldeki.com',
    role: 'business',
    label: 'İşletme',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    redirectPath: '/isletme'
  },
  {
    id: 'business-pending',
    email: import.meta.env.VITE_TEST_BUSINESS_PENDING_EMAIL || 'business-pending@test.haldeki.com',
    role: 'business',
    label: 'İşletme (Bekliyor)',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
    redirectPath: '/bekleyen'
  },
  {
    id: 'customer1',
    email: import.meta.env.VITE_TEST_CUSTOMER1_EMAIL || 'customer1@test.haldeki.com',
    role: 'customer',
    label: 'Müşteri',
    icon: <User className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300',
    redirectPath: '/'
  },
  {
    id: 'customer2',
    email: import.meta.env.VITE_TEST_CUSTOMER2_EMAIL || 'customer2@test.haldeki.com',
    role: 'customer',
    label: 'Müşteri 2',
    icon: <User className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300',
    redirectPath: '/'
  },
  {
    id: 'warehouse-manager',
    email: import.meta.env.VITE_TEST_WAREHOUSE_EMAIL || 'warehouse@test.haldeki.com',
    role: 'warehouse_manager',
    label: 'Depo Yöneticisi',
    icon: <Warehouse className="h-4 w-4" />,
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
    redirectPath: '/depo'
  },
];

const DEFAULT_PASSWORD = import.meta.env.VITE_TEST_DEFAULT_PASS || 'Test1234!';
const STORAGE_KEY = 'role-switcher-open';
const SHORTCUT_KEY = 'd';

export const RoleSwitcher = () => {
  // SECURITY: Double-check production environment
  // This ensures the component never renders in production, even if the check above is bypassed
  if (PROD_CHECK) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setOpen(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === SHORTCUT_KEY) {
        e.preventDefault();
        setOpen(prev => {
          const newState = !prev;
          localStorage.setItem(STORAGE_KEY, String(newState));
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickLogin = async (account: TestAccount) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: DEFAULT_PASSWORD,
      });

      if (error) {
        toast.error('Test hesabı bulunamadı. Migration çalıştırın.');
        console.error('Login error:', error);
        return;
      }

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{account.label} olarak giriş yapıldı</span>
        </div>
      );

      setTimeout(() => {
        window.location.href = account.redirectPath;
      }, 500);
    } catch (err) {
      toast.error('Giriş başarısız');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.info('Çıkış yapıldı');
  };

  const groupedAccounts = TEST_ACCOUNTS.reduce((acc, account) => {
    if (!acc[account.role]) acc[account.role] = [];
    acc[account.role].push(account);
    return acc;
  }, {} as Record<string, TestAccount[]>);

  const roleLabels: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    dealer: 'Bayiler',
    supplier: 'Tedarikçiler',
    business: 'İşletmeler',
    customer: 'Müşteriler',
    warehouse_manager: 'Depo Yöneticileri',
  };

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      localStorage.setItem(STORAGE_KEY, String(newOpen));
    }}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={`
            fixed bottom-6 right-6 z-50
            shadow-lg hover:shadow-xl
            transition-all duration-300
            ${open ? 'scale-90 rotate-180' : 'scale-100 rotate-0'}
          `}
          title={`Role Switcher (Ctrl+Shift+${SHORTCUT_KEY.toUpperCase()})`}
        >
          <FlaskConical className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        side="top"
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Role Switcher</span>
            </div>
            <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Ctrl+Shift+{SHORTCUT_KEY.toUpperCase()}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Hızlı test hesabı geçişi:
          </div>

          {Object.entries(groupedAccounts).map(([role, accounts]) => (
            <div key={role} className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {roleLabels[role] || role}
              </div>
              <div className="space-y-1">
                {accounts.map(account => (
                  <Button
                    key={account.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-2 hover:bg-muted/50 hover:text-foreground"
                    onClick={() => quickLogin(account)}
                    disabled={isLoading}
                  >
                    <span className="mr-2 text-muted-foreground group-hover:text-foreground transition-colors">{account.icon}</span>
                    <span className="flex-1 text-left text-sm">{account.label}</span>
                    <Badge className={account.color} variant="outline">
                      {account.role}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-9"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
