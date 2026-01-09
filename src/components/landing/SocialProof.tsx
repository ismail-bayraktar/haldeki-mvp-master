import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const SocialProof = ({ className }: { className?: string }) => {
  return (
    <section className={cn("py-12 md:py-16 bg-primary text-primary-foreground", className)}>
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm mb-6">
            <BadgeCheck className="h-4 w-4" />
            <span>Pilot Programı</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            İlk Pilot Kullanıcılar Arasındaki Yerinizi Ayırtın
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed">
            Haldekcom olarak İzmir merkezinde başlattığımız pilot uygulamada sınırlı sayıda
            kullanıcıya hizmet vereceğiz. Erken erişim listesine katılanlara:
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-primary-foreground/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary-foreground mb-1">
                Özel Fiyat
              </div>
              <div className="text-sm text-primary-foreground/70">
                Avantajları
              </div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary-foreground mb-1">
                Ücretsiz
              </div>
              <div className="text-sm text-primary-foreground/70">
                Teslimat
              </div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary-foreground mb-1">
                İlk Erişim
              </div>
              <div className="text-sm text-primary-foreground/70">
                Hakkı
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-foreground opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-foreground"></span>
            </span>
            Sınırlı Kontejan
          </div>
        </div>
      </div>
    </section>
  );
};
