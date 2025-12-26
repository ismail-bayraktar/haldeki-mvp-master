import { UserPlus, MapPin, ShoppingCart, Truck, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/layout";

const NasilCalisir = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Üye Olun",
      description: "Hızlıca üye olun veya Google hesabınızla giriş yapın. Üyelik tamamen ücretsizdir.",
      color: "bg-haldeki-green-light text-haldeki-green",
    },
    {
      icon: MapPin,
      title: "Bölgenizi Seçin",
      description: "Teslimat yapılacak bölgenizi seçin. Her bölge için minimum sipariş tutarı ve teslimat koşulları farklılık gösterebilir.",
      color: "bg-fresh-orange-light text-fresh-orange",
    },
    {
      icon: ShoppingCart,
      title: "Sepetinizi Doldurun",
      description: "Taze meyve ve sebzeleri sepetinize ekleyin. Bugün Halde bölümünden günün en taze fırsatlarını kaçırmayın.",
      color: "bg-secondary text-haldeki-green",
    },
    {
      icon: Truck,
      title: "Teslimat Saati Seçin",
      description: "Size uygun teslimat saatini seçin. Aynı gün teslimat veya ileri tarihli teslimat seçeneklerimiz mevcut.",
      color: "bg-haldeki-green-light text-haldeki-green",
    },
    {
      icon: CheckCircle,
      title: "Kapınıza Gelsin",
      description: "Siparişiniz özenle hazırlanıp, seçtiğiniz saatte kapınıza teslim edilir. Taze ve kaliteli ürünlerin keyfini çıkarın!",
      color: "bg-fresh-orange-light text-fresh-orange",
    },
  ];

  const benefits = [
    { title: "Halden Sofranıza", desc: "Aracı olmadan direkt hal fiyatlarına taze ürünler" },
    { title: "Günlük Taze Ürünler", desc: "Her gün halden gelen en taze meyve ve sebzeler" },
    { title: "Kolay Teslimat", desc: "Kapınıza kadar ücretsiz teslimat (150₺ üzeri)" },
    { title: "Kalite Garantisi", desc: "Beğenmediğiniz ürünü iade alıyoruz" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero */}
        <section className="py-12 md:py-20 bg-organic-pattern">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nasıl Çalışır?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Haldeki ile taze meyve ve sebze sipariş etmek çok kolay. 
              5 basit adımda halden sofranıza!
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-0">
              {steps.map((step, index) => (
                <div key={index} className="relative flex gap-6 pb-12 last:pb-0">
                  {/* Timeline line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  {/* Icon */}
                  <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-soft`}>
                    <step.icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Adım {index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Neden Haldeki?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 shadow-card text-center">
                  <h4 className="font-bold text-lg mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Hemen Başlayın!
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Taze meyve ve sebzelerin keyfini çıkarmak için hemen alışverişe başlayın.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/urunler">Ürünleri Keşfet</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/bugun-halde">Bugün Halde</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default NasilCalisir;
