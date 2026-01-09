// Supplier Mobile Layout Component (Phase 9 - Mobile First)

import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Breadcrumbs, BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { cn } from '@/lib/utils';
import { SupplierBottomNav } from '@/components/supplier/SupplierBottomNav';

interface SupplierMobileLayoutProps {
  title?: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  showBackButton?: boolean;
  backTo?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: ReactNode;
}

export function SupplierMobileLayout({
  title,
  action,
  actionLabel,
  actionHref,
  showBackButton = false,
  backTo = '/tedarikci',
  breadcrumbs,
  children,
}: SupplierMobileLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-2">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          <div className="flex items-center justify-between">
            {/* Left: Back button or Logo */}
            <div className="flex items-center">
              {showBackButton ? (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="mr-2"
                >
                  <Link to={backTo}>
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                </Button>
              ) : null}

              {title && (
                <h1 className="text-lg font-semibold truncate">
                  {title}
                </h1>
              )}
            </div>

            {/* Right: Action button */}
            <div>
              {action || (actionHref && actionLabel) ? (
                action || (
                  <Button
                    asChild
                    size="sm"
                    className="gap-2"
                  >
                    <Link to={actionHref!}>
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{actionLabel}</span>
                    </Link>
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children ? (
        <main className="container mx-auto px-4 py-4">
          {children}
        </main>
      ) : (
        <Outlet />
      )}

      {/* Bottom Navigation (Mobile Only) */}
      <SupplierBottomNav />
    </div>
  );
}

/**
 * Page header component for mobile pages
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/**
 * Mobile-friendly card container
 */
interface MobileCardContainerProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardContainer({ children, className }: MobileCardContainerProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}
