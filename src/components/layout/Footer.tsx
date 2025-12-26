import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import logotype from "@/assets/logotype_dark.svg";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <img 
              src={logotype} 
              alt="Haldeki" 
              className="h-10 brightness-0 invert"
            />
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Dijital hal deneyimi ile taze meyve ve sebzeleri toptan fiyatlarına kapınıza getiriyoruz.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Hızlı Bağlantılar</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/urunler" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Tüm Ürünler
              </Link>
              <Link to="/bugun-halde" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Bugün Halde
              </Link>
              <Link to="/nasil-calisir" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Nasıl Çalışır?
              </Link>
              <Link to="/hakkimizda" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Hakkımızda
              </Link>
              <Link to="/iletisim" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                İletişim
              </Link>
            </nav>
          </div>

          {/* Teslimat Bölgeleri */}
          <div>
            <h4 className="font-bold text-lg mb-4">Teslimat Bölgeleri</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/menemen-taze-sebze-meyve" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Menemen Teslimat
              </Link>
              <Link to="/aliaga-taze-sebze-meyve" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Aliağa Teslimat
              </Link>
            </nav>
            <div className="mt-4">
              <h4 className="font-bold text-lg mb-4">Kategoriler</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/urunler?kategori=meyveler" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Meyveler
                </Link>
                <Link to="/urunler?kategori=sebzeler" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Sebzeler
                </Link>
                <Link to="/urunler?kategori=yesillikler" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Yeşillikler
                </Link>
              </nav>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">İletişim</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+902121234567" className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Phone className="h-4 w-4" />
                0212 123 45 67
              </a>
              <a href="mailto:info@haldeki.com" className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Mail className="h-4 w-4" />
                info@haldeki.com
              </a>
              <div className="flex items-start gap-2 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>İzmir, Menemen - Aliağa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {currentYear} Haldeki. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <Link to="/gizlilik" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              Gizlilik Politikası
            </Link>
            <Link to="/kullanim-kosullari" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              Kullanım Koşulları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
