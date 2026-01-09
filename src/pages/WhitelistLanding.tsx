import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail, MapPin, Clock, Star, Users, Truck } from "lucide-react";
import { Header, Footer, MobileNav } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/seo";
import { useAuth } from "@/contexts/AuthContext";
import {
  WhitelistForm,
  ValueProps,
  FAQ,
  SocialProof,
} from "@/components/landing";
import { getBugunHaldeProducts } from "@/data/products";

const WhitelistLanding = () => {
  const { isAuthenticated, roles, openAuthDrawer } = useAuth();

  // Check if user is a customer (has 'user' role and no special roles)
  const isCustomer = isAuthenticated && roles.includes('user') &&
    !roles.includes('admin') && !roles.includes('superadmin') &&
    !roles.includes('dealer') && !roles.includes('supplier') &&
    !roles.includes('business') && !roles.includes('warehouse_manager');

  const products = getBugunHaldeProducts()
    .sort((a, b) => a.price - b.price)
    .slice(0, 8);

  // Duplicate for seamless infinite scroll
  const scrollProducts = [...products, ...products];

  const trustSignals = [
    { icon: Star, value: "4.8", label: "Puan" },
    { icon: Users, value: "500+", label: "Pilot Kullanıcı" },
    { icon: Truck, value: "Ücretsiz", label: "Teslimat" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PageMeta
        title="Erken Erişim Listesi | Haldeki - İzmir'in Taze Sebze Meyvesi"
        description="İzmir'in en taze sebze meyvesi kapınıza gelsin. Yerel çiftçilerden toptan fiyatlarla. İlk pilot kullanıcılar arasında yerinizi ayırtın."
        keywords="izmir meyve sebze, erken erişim, whitelist, yerel çiftçi, toptan fiyat, aynı gün teslimat"
        canonicalUrl="https://haldeki.com/izmir-cagri"
        openGraphUrl="https://haldeki-market.vercel.app/izmir-cagri"
      />

      <Header />

      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero Section - Same as Index Page with Vertical Scrolling Products */}
        <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-stretch overflow-hidden">
          {/* Soft gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-haldeki-green-soft to-haldeki-green-medium" />

          {/* Decorative circles */}
          <div className="absolute top-10 left-10 w-64 h-64 md:w-96 md:h-96 rounded-full bg-haldeki-green-soft/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-48 h-48 md:w-72 md:h-72 rounded-full bg-accent/15 blur-3xl" />

          <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-8 py-12 md:py-16">
            {/* Left Side - Hero Content */}
            <div className="flex-1 space-y-6 md:space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground px-4 py-2 rounded-full shadow-lg">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-medium">İzmir Pilot Başvurusu</span>
              </div>

              {/* Main headline */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                İzmir'in En Taze Sebze Meyvesi Kapınıza Gelsin
              </h1>

              {/* Subheadline */}
              <p className="text-base md:text-xl text-primary-foreground/80 max-w-xl leading-relaxed">
                Yerel çiftçilerden taze ürünler, toptan hal fiyatları. İlk pilot
                kullanıcılar arasında yerinizi ayırtın.
              </p>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 py-2 md:py-4">
                {trustSignals.map((signal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="p-1.5 md:p-2 rounded-full bg-primary-foreground/10">
                      <signal.icon className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                    </div>
                    <div>
                      <span className="font-bold text-base md:text-lg text-primary-foreground">{signal.value}</span>
                      <span className="text-xs md:text-sm text-primary-foreground/70 ml-1">{signal.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 md:gap-4 pt-2 md:pt-4">
                {/* Primary CTA - Whitelist for guests, Browse for customers */}
                {isCustomer ? (
                  <Button
                    as={Link}
                    to="/urunler"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Ürünleri İncele
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    onClick={() => {
                      document.getElementById("whitelist-form")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                  >
                    Erken Erişim Listesine Katıl
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                )}

                {/* Secondary CTA - Auth for guests, Whitelist for customers */}
                <Button
                  size="lg"
                  className="bg-primary-foreground/10 border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/60 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation backdrop-blur-sm"
                  onClick={() => {
                    if (isCustomer) {
                      document.getElementById("whitelist-form")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    } else {
                      openAuthDrawer();
                    }
                  }}
                >
                  {isCustomer ? "Listeye Katıl" : "Hemen Başla"}
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>

                {/* Third CTA - WhatsApp contact */}
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-primary-foreground/10 border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/60 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation backdrop-blur-sm"
                  asChild
                >
                  <a href="https://wa.me/905551234567" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4 md:h-5 md:w-5" />
                    WhatsApp İletişim
                  </a>
                </Button>
              </div>
            </div>

            {/* Desktop - Vertical Scrolling Products */}
            <div className="hidden lg:block w-80 xl:w-96 h-[500px] xl:h-[550px] relative overflow-hidden">
              {/* Gradient overlays for smooth fade effect */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-haldeki-green-medium to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-haldeki-green-medium to-transparent z-10 pointer-events-none" />

              {/* Scrolling container */}
              <div className="product-scroll-container h-full">
                <div className="product-scroll-content space-y-4">
                  {scrollProducts.map((product, index) => (
                    <Link
                      key={`${product.id}-${index}`}
                      to={`/urun/${product.slug}`}
                      className="block bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 p-3">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/30">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            width="80"
                            height="80"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                              Bugün Halde
                            </span>
                            {product.previousPrice && product.priceChange === "down" && (
                              <span className="text-xs font-bold bg-fresh-down/20 text-fresh-down px-2 py-0.5 rounded-full">
                                %{Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)} indirim
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-lg text-primary">
                              {product.price.toFixed(2)} TL
                            </span>
                            <span className="text-xs text-muted-foreground">/{product.unit}</span>
                            {product.previousPrice && product.priceChange === "down" && (
                              <span className="text-sm text-muted-foreground line-through">
                                {product.previousPrice.toFixed(2)} TL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile - Horizontal Carousel */}
            <div className="lg:hidden w-full overflow-hidden py-4">
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide touch-pan-x">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/urun/${product.slug}`}
                    className="flex-shrink-0 w-40 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg snap-start"
                  >
                    <div className="relative">
                      <img
                        src={product.images?.[0] || "/placeholder.svg"}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width="160"
                        height="112"
                        className="w-full h-28 object-cover"
                      />
                      {product.previousPrice && product.priceChange === "down" && (
                        <span className="absolute top-2 right-2 text-xs font-bold bg-fresh-down text-white px-2 py-0.5 rounded-full">
                          %{Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground text-sm truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-bold text-primary">
                          {product.price.toFixed(2)} TL
                        </span>
                        <span className="text-xs text-muted-foreground">/{product.unit}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <ValueProps />

        {/* Social Proof */}
        <SocialProof />

        {/* Whitelist Form */}
        <section id="whitelist-form" className="py-12 md:py-16 bg-secondary/30">
          <div className="container">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Başvuru Formu
                </h2>
                <p className="text-muted-foreground">
                  Sınırlı kontejan için erken kayıt yaptırın.
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <WhitelistForm />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ />

        {/* Contact Info */}
        <section className="py-12 border-t">
          <div className="container">
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <a
                href="https://wa.me/905551234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-card transition-shadow"
              >
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium text-sm text-foreground">+90 555 XXX XX XX</p>
                </div>
              </a>
              <a
                href="mailto:info@haldeki.com"
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-card transition-shadow"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">E-posta</p>
                  <p className="font-medium text-sm text-foreground">info@haldeki.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Konum</p>
                  <p className="font-medium text-sm text-foreground">İzmir, Türkiye</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Links */}
        <section className="py-8 border-t bg-secondary/20">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                KVKK Aydınlatma Metni
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Gizlilik Politikası
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Kullanım Koşulları
              </a>
              <a href="/iletisim" className="hover:text-foreground transition-colors">
                İletişim
              </a>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              © {new Date().getFullYear()} Haldekcom. Tüm hakları saklıdır.
            </p>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default WhitelistLanding;
