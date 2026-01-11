import { LayoutDashboard, ShoppingCart, Users, Settings, Package, MapPin, ChevronLeft, Store, Truck, FileText, Building2, Warehouse, TrendingDown, UserCheck, Percent, Layers, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logotypeDark from "@/assets/logotype_dark.svg";

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Siparişler",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Kullanıcılar",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Ürünler",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Varyasyon Türleri",
    url: "/admin/variation-types",
    icon: Layers,
  },
  {
    title: "Bölge Ürünleri",
    url: "/admin/region-products",
    icon: MapPin,
  },
  {
    title: "Bayiler",
    url: "/admin/dealers",
    icon: Store,
  },
  {
    title: "Tedarikçiler",
    url: "/admin/suppliers",
    icon: Truck,
  },
  {
    title: "İşletmeler",
    url: "/admin/businesses",
    icon: Building2,
  },
  {
    title: "Teklifler",
    url: "/admin/supplier-offers",
    icon: FileText,
  },
  {
    title: "Depo Personeli",
    url: "/admin/warehouse-staff",
    icon: Warehouse,
  },
  {
    title: "Bugün Halde",
    url: "/admin/bugun-halde",
    icon: TrendingDown,
  },
  {
    title: "Whitelist",
    url: "/admin/whitelist-applications",
    icon: UserCheck,
  },
  {
    title: "Fiyatlandırma",
    url: "/admin/pricing",
    icon: Percent,
  },
];

const secondaryItems = [
  {
    title: "Ayarlar",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border" data-testid="admin-sidebar">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src={logotypeDark} alt="Haldeki" className="h-6" />
              <span className="text-xs font-medium text-muted-foreground">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ana Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} data-testid={`nav-${item.url.split('/').pop()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} data-testid={`nav-${item.url.split('/').pop()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            © 2024 Haldeki
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
