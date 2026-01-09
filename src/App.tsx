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
import Index from "./pages/Index";
import BugunHalde from "./pages/BugunHalde";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NasilCalisir from "./pages/NasilCalisir";
import Hakkimizda from "./pages/Hakkimizda";
import Iletisim from "./pages/Iletisim";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderComplete from "./pages/OrderComplete";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import MenemenLanding from "./pages/MenemenLanding";
import AliagaLanding from "./pages/AliagaLanding";
import WhitelistLanding from "./pages/WhitelistLanding";
import Auth from "./pages/Auth";
import BayiKayit from "./pages/BayiKayit";
import TedarikciKayit from "./pages/TedarikciKayit";
import BusinessRegistration from "./pages/BusinessRegistration";
import Beklemede from "./pages/Beklemede";
import NotFound from "./pages/NotFound";

// Admin imports
import { AdminLayout } from "@/components/admin";
import { AdminDashboard, AdminOrders, AdminUsers, AdminProducts, AdminSettings, AdminBusinesses, AdminBugunHalde, WhitelistApplicationsPage } from "./pages/admin";
import AdminRegionProducts from "./pages/admin/RegionProducts";
import AdminDealers from "./pages/admin/Dealers";
import AdminSuppliers from "./pages/admin/Suppliers";
import AdminSupplierOffers from "./pages/admin/SupplierOffers";
import AdminWarehouseStaff from "./pages/admin/WarehouseStaff";

// Role-specific imports
import DealerDashboard from "./pages/dealer/DealerDashboard";
import DealerCustomers from "./pages/dealer/DealerCustomers";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import SupplierProducts from "./pages/supplier/Products";
import SupplierProductForm from "./pages/supplier/ProductForm";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import RequireRole from "@/components/auth/RequireRole";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Account imports
import AccountOrders from "./pages/account/Orders";
import PaymentNotification from "./pages/PaymentNotification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
