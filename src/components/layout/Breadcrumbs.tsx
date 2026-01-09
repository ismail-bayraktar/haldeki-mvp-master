import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  homeHref?: string;
}

export function Breadcrumbs({
  items,
  className,
  homeHref = '/',
}: BreadcrumbsProps) {
  const allItems = [
    { label: 'Ana Sayfa', href: homeHref, icon: <Home className="h-4 w-4" /> },
    ...items,
  ];

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)} aria-label="Breadcrumb">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
            )}

            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[200px]">
                {item.icon}
                <span className="truncate" aria-current="page">
                  {item.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
