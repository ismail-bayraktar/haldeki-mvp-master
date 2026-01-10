/**
 * Unit Tests for RequireRole Component
 * Testing role-based access control and routing logic
 *
 * Coverage:
 * - SuperAdmin redirect from /tedarikci to /admin/suppliers
 * - Supplier access to /tedarikci routes
 * - Guest redirect to /giris
 * - Admin access to /admin routes
 * - Regular user denied from /admin routes
 * - Approval status checks for dealer/supplier
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireRole from '@/components/auth/RequireRole';
import { vi } from 'vitest';
import { ReactNode } from 'react';

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth: mockUseAuth } = await import('@/contexts/AuthContext');

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/tedarikci']}>
    <Routes>
      <Route
        path="/tedarikci"
        element={
          <RequireRole allowedRoles={['supplier']} redirectTo="/giris">
            {children}
          </RequireRole>
        }
      />
      <Route path="/admin/suppliers" element={<div data-testid="admin-suppliers-page">Admin Suppliers</div>} />
      <Route path="/giris" element={<div data-testid="login-page">Login</div>} />
      <Route path="/" element={<div data-testid="home-page">Home</div>} />
      <Route
        path="/admin"
        element={
          <RequireRole allowedRoles={['admin']} redirectTo="/">
            <div data-testid="admin-page">Admin Dashboard</div>
          </RequireRole>
        }
      />
      <Route path="/beklemede" element={<div data-testid="pending-page">Pending</div>} />
    </Routes>
  </MemoryRouter>
);

describe('RequireRole - Role-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SuperAdmin Access & Redirect', () => {
    it('should redirect SuperAdmin from /tedarikci to /admin/suppliers', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'superadmin',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByTestId('supplier-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('admin-suppliers-page')).toBeInTheDocument();
    });

    it('should allow SuperAdmin access to admin routes', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'superadmin' || role === 'admin',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']} redirectTo="/">
                  <div data-testid="admin-page">Admin Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });

    it('should grant SuperAdmin access to supplier routes when not accessing /tedarikci path', () => {
      // Arrange - SuperAdmin accessing a non-supplier route
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'superadmin',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act - Accessing a different route that allows superadmin
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <RequireRole allowedRoles={['superadmin', 'supplier']} redirectTo="/">
                  <div data-testid="dashboard-page">Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Supplier Access Control', () => {
    it('should allow supplier with approved status to access /tedarikci', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'supplier',
        isDealer: false,
        isSupplier: true,
        approvalStatus: 'approved',
        isApprovalChecked: true,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.getByTestId('supplier-page')).toBeInTheDocument();
    });

    it('should redirect supplier with pending status to /beklemede', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'supplier',
        isDealer: false,
        isSupplier: true,
        approvalStatus: 'pending',
        isApprovalChecked: true,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByTestId('supplier-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });

    it('should redirect supplier with rejected status to /beklemede', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'supplier',
        isDealer: false,
        isSupplier: true,
        approvalStatus: 'rejected',
        isApprovalChecked: true,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByTestId('supplier-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
  });

  describe('Guest/Unauthenticated Access', () => {
    it('should redirect unauthenticated user to /giris', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isRolesChecked: true,
        hasRole: () => false,
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByTestId('supplier-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should show loading spinner while checking authentication', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        isRolesChecked: false,
        hasRole: () => false,
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: false,
      });

      // Act
      render(
        <TestWrapper>
          <div data-testid="supplier-page">Supplier Dashboard</div>
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByTestId('supplier-page')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Admin Access Control', () => {
    it('should allow admin to access /admin routes', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'admin',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']} redirectTo="/">
                  <div data-testid="admin-page">Admin Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });

    it('should deny regular user access to /admin routes', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'user',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']} redirectTo="/">
                  <div data-testid="admin-page">Admin Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('Dealer Access Control', () => {
    it('should allow approved dealer to access dealer routes', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'dealer',
        isDealer: true,
        isSupplier: false,
        approvalStatus: 'approved',
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/dealer']}>
          <Routes>
            <Route
              path="/dealer"
              element={
                <RequireRole allowedRoles={['dealer']} redirectTo="/">
                  <div data-testid="dealer-page">Dealer Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('dealer-page')).toBeInTheDocument();
    });

    it('should redirect pending dealer to /beklemede', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'dealer',
        isDealer: true,
        isSupplier: false,
        approvalStatus: 'pending',
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/dealer']}>
          <Routes>
            <Route
              path="/dealer"
              element={
                <RequireRole allowedRoles={['dealer']} redirectTo="/">
                  <div data-testid="dealer-page">Dealer Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/beklemede" element={<div data-testid="pending-page">Pending</div>} />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId('dealer-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });

    it('should show loading while checking dealer approval status', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'dealer',
        isDealer: true,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: false,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/dealer']}>
          <Routes>
            <Route
              path="/dealer"
              element={
                <RequireRole allowedRoles={['dealer']} redirectTo="/">
                  <div data-testid="dealer-page">Dealer Dashboard</div>
                </RequireRole>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId('dealer-page')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Multi-Role Support', () => {
    it('should allow access if user has any of the allowed roles', () => {
      // Arrange - User has 'dealer' role, route allows ['dealer', 'supplier']
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'dealer',
        isDealer: true,
        isSupplier: false,
        approvalStatus: 'approved',
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <RequireRole allowedRoles={['dealer', 'supplier']} redirectTo="/">
                  <div data-testid="dashboard-page">Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('should deny access if user has none of the allowed roles', () => {
      // Arrange - User has 'user' role, route allows ['dealer', 'supplier']
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'user',
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <RequireRole allowedRoles={['dealer', 'supplier']} redirectTo="/">
                  <div data-testid="dashboard-page">Dashboard</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('Custom Redirect Path', () => {
    it('should use custom redirectTo when specified', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: () => false,
        isDealer: false,
        isSupplier: false,
        approvalStatus: null,
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireRole allowedRoles={['admin']} redirectTo="/custom-redirect">
                  <div data-testid="protected-page">Protected</div>
                </RequireRole>
              }
            />
            <Route path="/custom-redirect" element={<div data-testid="custom-page">Custom</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-page')).toBeInTheDocument();
    });
  });

  describe('Approval Check Bypass', () => {
    it('should not check approval status when requireApproval is false', () => {
      // Arrange - Supplier with pending status but requireApproval=false
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'supplier',
        isDealer: false,
        isSupplier: true,
        approvalStatus: 'pending',
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/supplier-public']}>
          <Routes>
            <Route
              path="/supplier-public"
              element={
                <RequireRole allowedRoles={['supplier']} requireApproval={false}>
                  <div data-testid="supplier-public-page">Public Supplier Page</div>
                </RequireRole>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Assert - Should allow access despite pending status
      expect(screen.getByTestId('supplier-public-page')).toBeInTheDocument();
    });

    it('should check approval status when requireApproval is true (default)', () => {
      // Arrange - Supplier with pending status and requireApproval=true
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isRolesChecked: true,
        hasRole: (role: string) => role === 'supplier',
        isDealer: false,
        isSupplier: true,
        approvalStatus: 'pending',
        isApprovalChecked: true,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/supplier-private']}>
          <Routes>
            <Route
              path="/supplier-private"
              element={
                <RequireRole allowedRoles={['supplier']} requireApproval={true}>
                  <div data-testid="supplier-private-page">Private Supplier Page</div>
                </RequireRole>
              }
            />
            <Route path="/beklemede" element={<div data-testid="pending-page">Pending</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Assert - Should redirect to pending page
      expect(screen.queryByTestId('supplier-private-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
  });
});
