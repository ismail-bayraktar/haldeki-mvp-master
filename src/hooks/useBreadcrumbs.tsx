import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { MenuItem } from '@/components/admin/AdminSidebar';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs';

const IconWrapper = ({ Icon }: { Icon: MenuItem['icon'] }) => {
  return <Icon className="h-4 w-4" />;
};

export function useBreadcrumbs(menuItems: MenuItem[]): BreadcrumbItem[] {
  const location = useLocation();
  const pathname = location.pathname;

  return useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [];

    const matchingItem = menuItems.find(item => {
      if (item.url === pathname) return true;
      if (pathname.startsWith(item.url + '/')) return true;
      return false;
    });

    if (matchingItem) {
      breadcrumbs.push({
        label: matchingItem.breadcrumbLabel,
        href: matchingItem.url,
        icon: <IconWrapper Icon={matchingItem.icon} />
      });

      const segments = pathname.slice(matchingItem.url.length + 1).split('/');

      if (segments[0] === 'edit' || segments[0] === 'duzenle') {
        breadcrumbs.push({ label: 'Düzenle' });
      } else if (segments[0] === 'create' || segments[0] === 'yeni') {
        breadcrumbs.push({ label: 'Yeni Oluştur' });
      } else if (segments.length > 0 && segments[0]) {
        breadcrumbs.push({ label: 'Detay' });
      }
    }

    return breadcrumbs;
  }, [pathname, menuItems]);
}
