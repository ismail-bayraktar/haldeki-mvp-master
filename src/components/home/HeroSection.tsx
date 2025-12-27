import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBugunHaldeProducts } from "@/data/products";

const HeroSection = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const products = getBugunHaldeProducts()
    .sort((a, b) => a.price - b.price)
    .slice(0, 8);

  // Calculate time until 18:00 (6 PM) cutoff for same-day delivery
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(18, 0, 0, 0);

      if (now >= cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }

      const diff = cutoff.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const trustSignals = [
    { icon: Star, value: "4.8", label: "Puan" },
    { icon: Users, value: "12,000+", label: "Musteri" },
    { icon: Truck, value: "Ayni Gun", label: "Teslimat" },
  ];

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  // Duplicate products for seamless infinite scroll
  const scrollProducts = [...products, ...products];

  return (
    <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-stretch overflow-hidden">
      {/* Soft gradient background - primary to softer green */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-haldeki-green-soft to-haldeki-green-medium" />
      
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 md:w-96 md:h-96 rounded-full bg-haldeki-green-soft/20 blur-3xl" />
      <div className="absolute bottom-10 left-1/4 w-48 h-48 md:w-72 md:h-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-8 py-12 md:py-16">
        {/* Left Side - Hero Content */}
        <div className="flex-1 space-y-6 md:space-y-8 animate-fade-in">
          {/* Countdown Timer */}
          <div className="inline-flex items-center gap-3 bg-accent/90 text-accent-foreground px-4 py-2 rounded-full shadow-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-xs md:text-sm font-medium">Ayni gun teslimat icin son:</span>
            <div className="flex items-center gap-1 font-bold text-sm md:text-lg">
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded">
                {formatTime(timeLeft.hours)}
              </span>
              <span>:</span>
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded">
                {formatTime(timeLeft.minutes)}
              </span>
              <span>:</span>
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded">
                {formatTime(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
            Halden Sofraniza,
            <span className="block text-accent">En Taze Fiyatlarla</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-xl text-primary-foreground/80 max-w-xl leading-relaxed">
            Toptan fiyatlarla en taze meyve ve sebzeler. Aracilar olmadan, 
            dogrudan sizin kapinaiza.
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
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation shadow-lg hover:shadow-xl transition-all hover:scale-105"
              asChild
            >
              <Link to="/bugun-halde">
                Bugunku Fiyatlari Gor
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-primary-foreground/10 border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/60 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 touch-manipulation backdrop-blur-sm"
              asChild
            >
              <Link to="/urunler">
                Hemen Siparis Ver
              </Link>
            </Button>
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
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
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
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                          Bugun Halde
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
      </div>
    </section>
  );
};

export default HeroSection;
