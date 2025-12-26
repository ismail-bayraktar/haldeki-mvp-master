import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { toast } from "sonner";

export function AdminLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isRolesChecked, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isRolesChecked) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/giris");
      return;
    }

    if (!isAdmin) {
      toast.error("Bu sayfaya erişim yetkiniz yok");
      navigate("/");
      return;
    }
  }, [isLoading, isAuthenticated, isAdmin, isRolesChecked, navigate]);

  if (isLoading || !isRolesChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-muted/30">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
