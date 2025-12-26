import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Truck, Clock, Leaf, Phone, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";
import { ProductCarousel } from "@/components/product";
import { LocalBusinessSchema, DeliveryAreaSchema, PageMeta } from "@/components/seo";
import { products } from "@/data/products";

const AliagaLanding = () => {
  const featuredProducts = products.filter((p) => p.quality === "premium").slice(0, 6);

  const neighborhoods = [
    "Aliağa Merkez",
    "Çakmaklı",
    "Güzelhisar",
    "Helvacı",
    "Samurlu",
    "Yeni Mahalle",
    "Cumhuriyet Mahallesi",
  ];

  const advantages = [
    {
      icon: Building2,
      title: "İş Yerlerine Teslimat",
      description: "Sanayi bölgelerine özel hizmet",
    },
    {
      icon: Leaf,
      title: "Halden Taze",
      description: "Günlük taze ürünler, aracısız",
    },
    {
      icon: Clock,
      title: "150₺ Üzeri Ücretsiz",
      description: "Minimum sipariş tutarı",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PageMeta
        title="Aliağa Taze Meyve Sebze Siparişi | Haldeki"
        description="Aliağa ve çevresine aynı gün taze meyve sebze teslimatı. Halden kapınıza toptan fiyatlarına online sipariş. Çakmaklı, Güzelhisar, Helvacı teslimat."
        keywords="aliağa meyve sebze, aliağa taze sebze, aliağa hal, çakmaklı teslimat, güzelhisar meyve, aliağa online market"
        canonicalUrl="https://haldeki.com/aliaga-taze-sebze-meyve"
      />
      <LocalBusinessSchema
        name="Haldeki - Aliağa Taze Meyve Sebze"
        description="Aliağa ve çevresine aynı gün taze meyve sebze teslimatı. Toptan hal fiyatlarına online sipariş."
        areaServed={["Aliağa"]}
        locality="Aliağa"
        region="İzmir"
      />
      <DeliveryAreaSchema
        areas={neighborhoods.map((n) => ({
          name: n,
          locality: "Aliağa",
          region: "İzmir",
        }))}
      />

      <Header />

      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-haldeki-green-soft to-haldeki-green-medium py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
          <div className="container relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6">
                <MapPin className="h-4 w-4" />
                <span>Aliağa ve Çevresi</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Aliağa'ya Taze Meyve Sebze Teslimatı
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
                İzmir Hali'nden Aliağa'ya aynı gün teslimat. Sanayi bölgesi ve konutlara 
                toptan hal fiyatlarına online sipariş.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="hero" className="gap-2" asChild>
                  <Link to="/urunler">
                    Alışverişe Başla
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                  asChild
                >
                  <a href="tel:+902321234567">
                    <Phone className="h-5 w-5" />
                    Bizi Arayın
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="py-12 bg-secondary/30">
          <div className="container">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              Aliağa'da Hizmet Verdiğimiz Bölgeler
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {neighborhoods.map((neighborhood) => (
                <div
                  key={neighborhood}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm"
                >
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {neighborhood}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="py-12 md:py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              Neden Haldeki ile Sipariş Vermelisiniz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {advantages.map((advantage, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 shadow-md border border-border text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <advantage.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-muted-foreground">{advantage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Products */}
        <section className="py-12 md:py-16 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Aliağa'da En Çok Tercih Edilenler
                </h2>
                <p className="text-muted-foreground mt-1">
                  Bölgenizdeki en popüler taze ürünler
                </p>
              </div>
              <Button variant="outline" className="hidden sm:flex" asChild>
                <Link to="/urunler">
                  Tümünü Gör
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <ProductCarousel products={featuredProducts} />

            <div className="mt-4 sm:hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/urunler">
                  Tümünü Gör
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Aliağa'ya Taze Teslimat İçin Hazır mısınız?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              150₺ ve üzeri siparişlerinizde ücretsiz teslimat. Evlere ve iş yerlerine 
              aynı gün taze ürün teslimatı.
            </p>
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/urunler">
                Hemen Sipariş Ver
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default AliagaLanding;
