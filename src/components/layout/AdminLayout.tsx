/**
 * @deprecated AdminLayout is OBSOLETE - Not used in admin panel.
 * This layout was mistakenly added to admin pages but should ONLY be used in Supplier panel.
 * Keeping this file for potential future supplier panel use.
 *
 * Admin pages now use the original sidebar layout without breadcrumbs.
 */

import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { adminMenuItems } from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const breadcrumbs = useBreadcrumbs(adminMenuItems);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <header className="mb-6">
          <Breadcrumbs items={breadcrumbs} homeHref="/admin" />
        </header>
        {children}
      </main>
    </div>
  );
}
