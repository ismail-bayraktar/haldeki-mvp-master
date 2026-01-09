import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = 'superadmin' | 'admin' | 'warehouse_manager' | 'dealer' | 'supplier' | 'business' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: AppRole[];
  requireApproval?: boolean;
}

/**
 * ProtectedRoute - Authentication required route wrapper
 *
 * Behavior:
 * - If requireAuth=true and not authenticated → Redirect to homepage #whitelist-form
 * - If allowedRoles specified → Check user has at least one role
 * - If requireApproval=true → Check approval status for dealer/supplier
 *
 * Usage:
 * <ProtectedRoute requireAuth={true}>
 *   <Products />
 * </ProtectedRoute>
 *
 * <ProtectedRoute allowedRoles={['supplier']} requireApproval={true}>
 *   <SupplierDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
  requireApproval = false
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    isLoading,
    isRolesChecked,
    hasRole,
    isDealer,
    isSupplier,
    approvalStatus,
    isApprovalChecked,
    openAuthDrawer
  } = useAuth();

  const [shouldRedirectToBeklemede, setShouldRedirectToBeklemede] = useState(false);
  const [hasRedirectedToHome, setHasRedirectedToHome] = useState(false);

  // Redirect unauthenticated guests to homepage form
  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated && !hasRedirectedToHome) {
      // Check if already on homepage to prevent redirect loop
      const isOnHomepage = location.pathname === '/' || location.pathname === '/izmir-cagri';

      if (!isOnHomepage) {
        // Redirect to homepage with hash, replace history entry
        navigate('/#whitelist-form', { replace: true });
        setHasRedirectedToHome(true);
      } else {
        // Already on homepage, scroll to form
        const formElement = document.getElementById('whitelist-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setHasRedirectedToHome(true);
      }
    }
  }, [requireAuth, isLoading, isAuthenticated, hasRedirectedToHome, navigate, location.pathname]);

  // Handle redirect to beklemede
  useEffect(() => {
    if (shouldRedirectToBeklemede) {
      window.location.href = '/beklemede';
    }
  }, [shouldRedirectToBeklemede]);

  // Loading state
  if (isLoading || (requireAuth && !isRolesChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - Redirect will happen via useEffect
  if (requireAuth && !isAuthenticated) {
    return null; // Redirecting to homepage
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => hasRole(role));

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Yetkiniz Yok</h1>
            <p className="text-muted-foreground">Bu sayfaya erişim için yetkiniz bulunmuyor.</p>
          </div>
        </div>
      );
    }
  }

  // Check approval status for dealer/supplier
  if (requireApproval && (isDealer || isSupplier)) {
    // Wait for approval check
    if (!isApprovalChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Trigger redirect to beklemede if pending/rejected
    if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
      if (!shouldRedirectToBeklemede) {
        setShouldRedirectToBeklemede(true);
      }
      return null;
    }
  }

  return <>{children}</>;
}
