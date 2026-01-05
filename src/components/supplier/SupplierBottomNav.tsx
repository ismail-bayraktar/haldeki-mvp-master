// Supplier Bottom Navigation Component (Phase 9 - Mobile First)

import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: typeof Package;
}

const navItems: NavItem[] = [
  { path: '/tedarikci/urunler', label: 'Ürünler', icon: Package },
  { path: '/tedarikci/siparisler', label: 'Siparişler', icon: ShoppingCart },
  { path: '/tedarikci/teklifler', label: 'Teklifler', icon: FileText },
  { path: '/tedarikci/hazirlik', label: 'Hazırlık', icon: ClipboardCheck },
  { path: '/tedarikci/profil', label: 'Profil', icon: User },
];

export function SupplierBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/tedarikci/urunler' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: navActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full min-w-0 transition-colors',
                  navActive || isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
              end={item.path === '/tedarikci/urunler'}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium truncate px-1">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
