import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { RegionProvider } from "@/contexts/RegionContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import RequireRegionModal from "@/components/region/RequireRegionModal";
import { RoleSwitcher } from "@/components/dev/RoleSwitcher";
import RequireRole from "@/components/auth/RequireRole";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin";

// Lazy load components for code splitting
const WhitelistLanding = lazy(() => import("./pages/WhitelistLanding"));
const NasilCalisir = lazy(() => import("./pages/NasilCalisir"));
const Hakkimizda = lazy(() => import("./pages/Hakkimizda"));
const Iletisim = lazy(() => import("./pages/Iletisim"));
const MenemenLanding = lazy(() => import("./pages/MenemenLanding"));
const AliagaLanding = lazy(() => import("./pages/AliagaLanding"));
const Auth = lazy(() => import("./pages/Auth"));
const BayiKayit = lazy(() => import("./pages/BayiKayit"));
const TedarikciKayit = lazy(() => import("./pages/TedarikciKayit"));
const BusinessRegistration = lazy(() => import("./pages/BusinessRegistration"));
const Beklemede = lazy(() => import("./pages/Beklemede"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Protected routes
const Products = lazy(() => import("./pages/Products"));
const BugunHalde = lazy(() => import("./pages/BugunHalde"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Account = lazy(() => import("./pages/Account"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderComplete = lazy(() => import("./pages/OrderComplete"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Compare = lazy(() => import("./pages/Compare"));
const AccountOrders = lazy(() => import("./pages/account/Orders"));
const PaymentNotification = lazy(() => import("./pages/PaymentNotification"));

// Role-specific dashboards
const DealerDashboard = lazy(() => import("./pages/dealer/DealerDashboard"));
const DealerCustomers = lazy(() => import("./pages/dealer/DealerCustomers"));
const SupplierDashboard = lazy(() => import("./pages/supplier/SupplierDashboard"));
const SupplierProducts = lazy(() => import("./pages/supplier/Products"));
const SupplierProductForm = lazy(() => import("./pages/supplier/ProductForm"));
const BusinessDashboard = lazy(() => import("./pages/business/BusinessDashboard"));
const WarehouseDashboard = lazy(() => import("./pages/warehouse/WarehouseDashboard"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminBusinesses = lazy(() => import("./pages/admin/Businesses"));
const AdminBugunHalde = lazy(() => import("./pages/admin/BugunHalde"));
const WhitelistApplicationsPage = lazy(() => import("./pages/admin/WhitelistApplications"));
const AdminRegionProducts = lazy(() => import("./pages/admin/RegionProducts"));
const AdminDealers = lazy(() => import("./pages/admin/Dealers"));
const AdminSuppliers = lazy(() => import("./pages/admin/Suppliers"));
const AdminSupplierOffers = lazy(() => import("./pages/admin/SupplierOffers"));
const AdminWarehouseStaff = lazy(() => import("./pages/admin/WarehouseStaff"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

interface AppProps {
  queryClient?: QueryClient;
}

const App = ({ queryClient: providedQueryClient }: AppProps) => (
  <QueryClientProvider client={providedQueryClient || queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RegionProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <RequireRegionModal />
                  {/* DEV-only: Role switcher for testing */}
                  {import.meta.env.DEV && <RoleSwitcher />}
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes - Guest & Customer accessible */}
                      <Route path="/" element={<WhitelistLanding />} />
                      <Route path="/izmir-cagri" element={<WhitelistLanding />} />
                      <Route path="/nasil-calisir" element={<NasilCalisir />} />
                      <Route path="/hakkimizda" element={<Hakkimizda />} />
                      <Route path="/iletisim" element={<Iletisim />} />
                      <Route path="/menemen-taze-sebze-meyve" element={<MenemenLanding />} />
                      <Route path="/aliaga-taze-sebze-meyve" element={<AliagaLanding />} />
                      <Route path="/giris" element={<Auth />} />
                      <Route path="/bayi-kayit" element={<BayiKayit />} />
                      <Route path="/tedarikci-kayit" element={<TedarikciKayit />} />
                      <Route path="/isletme-kayit" element={<BusinessRegistration />} />
                      <Route path="/beklemede" element={<Beklemede />} />

                      {/* Protected routes - Auth required */}
                      <Route
                        path="/urunler"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Products />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/bugun-halde"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <BugunHalde />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/urun/:slug"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <ProductDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hesabim"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Account />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hesabim/siparisler"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <AccountOrders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/odeme-bildirimi/:orderId"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <PaymentNotification />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sepet"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/teslimat"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/siparis-tamamlandi"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <OrderComplete />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/favoriler"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/karsilastir"
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <Compare />
                          </ProtectedRoute>
                        }
                      />

                      {/* Dealer Dashboard - Only for dealers */}
                      <Route
                        path="/bayi"
                        element={
                          <RequireRole allowedRoles={['dealer']}>
                            <DealerDashboard />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/bayi/musteriler"
                        element={
                          <RequireRole allowedRoles={['dealer']}>
                            <DealerCustomers />
                          </RequireRole>
                        }
                      />

                      {/* Supplier Dashboard - Only for suppliers */}
                      <Route
                        path="/tedarikci"
                        element={
                          <RequireRole allowedRoles={['supplier']}>
                            <SupplierDashboard />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/tedarikci/urunler"
                        element={
                          <RequireRole allowedRoles={['supplier']}>
                            <SupplierProducts />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/tedarikci/urunler/yeni"
                        element={
                          <RequireRole allowedRoles={['supplier']}>
                            <SupplierProductForm />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/tedarikci/urunler/:id/duzenle"
                        element={
                          <RequireRole allowedRoles={['supplier']}>
                            <SupplierProductForm />
                          </RequireRole>
                        }
                      />

                      {/* Business Dashboard - Only for business users */}
                      <Route
                        path="/isletme"
                        element={
                          <RequireRole allowedRoles={['business']}>
                            <BusinessDashboard />
                          </RequireRole>
                        }
                      />

                      {/* Warehouse Dashboard - Only for warehouse staff */}
                      <Route
                        path="/depo"
                        element={
                          <RequireRole allowedRoles={['warehouse_manager']}>
                            <WarehouseDashboard />
                          </RequireRole>
                        }
                      />

                      {/* Redirect old backend route to new admin */}
                      <Route path="/backend" element={<Navigate to="/admin" replace />} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="region-products" element={<AdminRegionProducts />} />
                        <Route path="dealers" element={<AdminDealers />} />
                        <Route path="suppliers" element={<AdminSuppliers />} />
                        <Route path="businesses" element={<AdminBusinesses />} />
                        <Route path="supplier-offers" element={<AdminSupplierOffers />} />
                        <Route path="warehouse-staff" element={<AdminWarehouseStaff />} />
                        <Route path="bugun-halde" element={<AdminBugunHalde />} />
                        <Route path="whitelist-applications" element={<WhitelistApplicationsPage />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </RegionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
