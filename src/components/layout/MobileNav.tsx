import { Link, useLocation } from "react-router-dom";
import { Home, Tag, Grid3X3, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const MobileNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { itemCount } = useCart();
  const { openAuthDrawer, isAuthenticated } = useAuth();

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openAuthDrawer();
    }
  };

  const navItems = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/bugun-halde", label: "Bugün Halde", icon: Tag },
    { href: "/urunler", label: "Kategoriler", icon: Grid3X3 },
    { href: "/sepet", label: "Sepet", icon: ShoppingCart, badge: itemCount },
    { href: "/hesabim", label: "Hesabım", icon: User, onClick: handleAccountClick },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg safe-area-pb" data-testid="mobile-navigation">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`mobile-nav-${item.href.replace('/', '-') || 'home'}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
