import { useState, memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, MapPin, Menu, LogOut, Heart, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logotype from "@/assets/logotype_dark.svg";
import RegionSelector from "./RegionSelector";
import { AuthDrawer } from "@/components/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useRegion } from "@/contexts/RegionContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCompare } from "@/contexts/CompareContext";

const Header = memo(() => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);

  const { user, isAuthenticated, openAuthDrawer, logout } = useAuth();
  const { selectedRegion } = useRegion();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { itemCount: compareCount } = useCompare();

  const navLinks = useMemo(() => [
    { href: "/", label: "Ana Sayfa", badge: null },
    { href: "/bugun-halde", label: "Bugün Halde", badge: !isAuthenticated ? "Erken Erişim" : null },
    { href: "/urunler", label: "Ürünler", badge: !isAuthenticated ? "Erken Erişim" : null },
    { href: "/nasil-calisir", label: "Nasıl Çalışır?", badge: null },
  ], [isAuthenticated]);

  const handleRegionClick = useCallback(() => {
    setIsRegionSelectorOpen(true);
  }, []);

  const handleProtectedNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const isProtectedRoute = href === "/bugun-halde" || href === "/urunler";

    if (isProtectedRoute && !isAuthenticated) {
      e.preventDefault();

      if (window.location.pathname === "/" || window.location.pathname === "/izmir-cagri") {
        document.getElementById("whitelist-form")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        window.location.href = "/#whitelist-form";
      }
    }
  }, [isAuthenticated]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80" data-testid="header">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logotype} alt="Haldeki" loading="eager" decoding="async" width="120" height="40" className="h-8 md:h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" data-testid="desktop-navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                onClick={(e) => handleProtectedNavClick(e, link.href)}
                data-testid={`nav-link-${link.href.replace('/', '-') || 'home'}`}
              >
                {link.label}
                {link.badge && <span className="superscript-badge">{link.badge}</span>}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Region Selector */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-sm"
              onClick={handleRegionClick}
            >
              <MapPin className="h-4 w-4 text-accent" />
              <span className="max-w-[100px] truncate">
                {selectedRegion?.name || "Bölge Seç"}
              </span>
            </Button>

            {/* Compare */}
            <Link to="/karsilastir" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative">
                <GitCompare className="h-5 w-5" />
                {compareCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
                  >
                    {compareCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Wishlist */}
            <Link to="/favoriler" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/sepet" data-testid="cart-icon">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground"
                    data-testid="cart-count"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="user-menu">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg z-50">
                  <div className="px-3 py-2">
                    <p className="font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/hesabim" className="cursor-pointer">Hesabım</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favoriler" className="cursor-pointer">Favorilerim</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="logout-button">
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={openAuthDrawer} data-testid="login-button">
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {/* Mobile Region Selector */}
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleRegionClick}
                  >
                    <MapPin className="h-4 w-4 text-accent" />
                    {selectedRegion?.name || "Teslimat Bölgesi Seç"}
                  </Button>

                  <div className="h-px bg-border my-2" />

                  {navLinks.map((link) => (
                    <div key={link.href} className="flex items-center justify-between">
                      <Link
                        to={link.href}
                        className="flex items-center gap-2 py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                        onClick={(e) => handleProtectedNavClick(e, link.href)}
                      >
                        <span>{link.label}</span>
                        {link.badge && <span className="superscript-badge">{link.badge}</span>}
                      </Link>
                    </div>
                  ))}

                  <Link
                    to="/karsilastir"
                    className="flex items-center py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <GitCompare className="h-5 w-5 mr-2" />
                    Karsilastir
                    {compareCount > 0 && (
                      <Badge className="ml-auto bg-primary text-primary-foreground">
                        {compareCount}
                      </Badge>
                    )}
                  </Link>

                  <Link
                    to="/favoriler"
                    className="flex items-center py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Favorilerim
                    {wishlistCount > 0 && (
                      <Badge className="ml-auto bg-accent text-accent-foreground">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Link>

                  <div className="h-px bg-border my-2" />

                  {isAuthenticated ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-primary text-primary-foreground"
                      onClick={openAuthDrawer}
                    >
                      Giriş Yap
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden border-t bg-card px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                className="pl-10 bg-secondary/50 border-0"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Region Selector Modal (for header button) */}
        <RegionSelector
          isOpen={isRegionSelectorOpen}
          onClose={() => setIsRegionSelectorOpen(false)}
        />
      </header>

      {/* Auth Drawer */}
      <AuthDrawer />
    </>
  );
});

Header.displayName = "Header";

export default Header;
