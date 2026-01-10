import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";

type AppRole = 'superadmin' | 'admin' | 'dealer' | 'supplier' | 'user';

interface RequireRoleProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
  requireApproval?: boolean;
}

const RequireRole = ({ 
  children, 
  allowedRoles, 
  redirectTo = "/",
  requireApproval = true 
}: RequireRoleProps) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isRolesChecked, 
    hasRole,
    isDealer,
    isSupplier,
    approvalStatus,
    isApprovalChecked
  } = useAuth();
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

  // SuperAdmin bypass: allow access to all routes for audit/management
  const isSuperAdmin = hasRole('superadmin');

  // Redirect SuperAdmin from supplier routes to admin panel
  if (isSuperAdmin && location.pathname.startsWith('/tedarikci')) {
    return <Navigate to="/admin/suppliers" replace />;
  }

  if (!hasAccess && !isSuperAdmin) {
    // Log failed access attempt for debugging
    console.warn('[AUTH] Access denied', {
      path: location.pathname,
      userRoles: { isSuperAdmin, hasAccess },
      allowedRoles
    });
    return <Navigate to={redirectTo} replace />;
  }

  // For dealer/supplier roles, check approval status
  if (requireApproval && (isDealer || isSupplier)) {
    // Wait for approval status to be checked
    if (!isApprovalChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // If pending or rejected, redirect to beklemede page
    if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
      return <Navigate to="/beklemede" replace />;
    }
  }

  return <>{children}</>;
};

export default RequireRole;
