import { Link } from "react-router-dom";
import { Apple, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SeasonalHighlight = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Özel Sezon</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
              Mevsimin Tazeleri
            </h2>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Her mevsimin en taze ürünleri, en uygun fiyatlarla. Şu an gözde
              ürünlerimizi keşfedin ve farkı yaşayın.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Apple className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Taze Garanti</p>
                  <p className="text-xs text-muted-foreground">Her gün halden</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Özel Seçim</p>
                  <p className="text-xs text-muted-foreground">En kaliteli ürünler</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                variant="default"
                className="touch-manipulation"
                asChild
              >
                <Link to="/urunler?mevsim=taze">
                  Tazelikleri Keşfet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-square lg:aspect-[4/3] bg-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Apple className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    Sezonun Yıldız Ürünleri
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Tazelik garantisiyle kapınızda
                  </p>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground text-sm md:text-base">
                      %20'ye Varan İndirim
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sezonluk ürünlerde geçerli
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      -20%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeasonalHighlight;
