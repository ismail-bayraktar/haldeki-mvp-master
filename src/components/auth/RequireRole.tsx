import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = 'superadmin' | 'admin' | 'dealer' | 'supplier' | 'user';

interface RequireRoleProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const RequireRole = ({ children, allowedRoles, redirectTo = "/" }: RequireRoleProps) => {
  const { isAuthenticated, isLoading, isRolesChecked, hasRole } = useAuth();
  const location = useLocation();

  // Loading state
  if (isLoading || !isRolesChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/giris" state={{ from: location }} replace />;
  }

  // Check if user has any of the allowed roles
  const hasAccess = allowedRoles.some(role => hasRole(role));

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
