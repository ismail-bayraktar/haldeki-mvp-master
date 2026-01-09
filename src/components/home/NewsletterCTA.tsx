import { useState } from "react";
import { Mail, Bell, CheckCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setIsSubscribed(true);
    setEmail("");
  };

  return (
    <section className="py-12 md:py-16 bg-primary text-primary-foreground">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 mb-4">
            {isSubscribed ? (
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Leaf className="h-8 w-8 text-primary-foreground" />
            )}
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
            {isSubscribed ? "Teşekkürler!" : "İlk Siz Haberdar Olun"}
          </h2>

          <p className="text-base md:text-lg text-primary-foreground/80 leading-relaxed px-4">
            {isSubscribed
              ? "Bültenimize başarıyla abone oldunuz. Özel fırsatlardan ilk siz haberdar olacaksınız."
              : "Özel fırsatlar, yeni ürünler ve aynı gün teslimat indirimlerinden ilk siz haberdar olun."}
          </p>

          {!isSubscribed && (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-1 relative w-full">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresiniz"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-primary-foreground text-primary placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="default"
                  variant="secondary"
                  disabled={isLoading}
                  className="touch-manipulation whitespace-nowrap bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  {isLoading ? "İşleniyor..." : "Abone Ol"}
                </Button>
              </div>

              <p className="text-xs text-primary-foreground/60">
                Abone olarak{" "}
                <a href="/privacy" className="text-primary-foreground hover:underline underline-offset-2">
                  Gizlilik Politikası
                </a>
                {" "}nızı kabul etmiş olursunuz. İstediğiniz zaman abonelikten ayrılabilirsiniz.
              </p>
            </form>
          )}

          {isSubscribed && (
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Başarıyla abone oldunuz</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
