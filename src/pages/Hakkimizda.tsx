import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Truck, Users, Heart, Award, Target, Briefcase, Settings, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header, Footer, MobileNav } from "@/components/layout";

const Hakkimizda = () => {
  const values = [
    {
      icon: Leaf,
      title: "Tazelik",
      description: "Her gün halden gelen en taze meyve ve sebzeleri sizlere ulaştırıyoruz.",
    },
    {
      icon: Heart,
      title: "Güven",
      description: "Kalite garantimizle, beğenmediğiniz ürünleri koşulsuz iade alıyoruz.",
    },
    {
      icon: Truck,
      title: "Hız",
      description: "Aynı gün teslimat ile taze ürünler kapınızda.",
    },
    {
      icon: Users,
      title: "Topluluk",
      description: "Çiftçilerimiz ve müşterilerimizle birlikte büyüyen bir aile.",
    },
  ];

  const stats = [
    { value: "10.000+", label: "Mutlu Müşteri" },
    { value: "500+", label: "Ürün Çeşidi" },
    { value: "50+", label: "Teslimat Bölgesi" },
    { value: "100%", label: "Tazelik Garantisi" },
  ];

  const team = [
    { name: "Ahmet Yılmaz", role: "Kurucu & CEO", icon: Briefcase },
    { name: "Ayşe Kaya", role: "Operasyon Direktörü", icon: Settings },
    { name: "Mehmet Demir", role: "Tedarik Zinciri Müdürü", icon: Truck },
    { name: "Zeynep Arslan", role: "Müşteri Deneyimi Lideri", icon: Headphones },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-organic-pattern">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Halden Sofranıza, <span className="text-accent">Aracısız</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Haldeki, Türkiyenin en taze meyve ve sebzelerini doğrudan halden kapınıza 
                getiren dijital hal deneyimidir. Aracıları ortadan kaldırarak hem üreticiye 
                hem de tüketiciye en iyi değeri sunuyoruz.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent uppercase tracking-wide">Hikayemiz</span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Bir Hayalin Gerçeğe Dönüşmesi</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    2024 yılında İstanbulda kurulan Haldeki, geleneksel hal alışverişini 
                    dijital çağa taşıma vizyonuyla yola çıktı. Kurucumuz, çocukluğunda 
                    babası ile birlikte hale gittiği günleri hiç unutmadı.
                  </p>
                  <p>
                    O taze sebze ve meyve kokusu, üreticilerle kurulan sıcak ilişki ve 
                    sofralara taşınan lezzetler... Ancak modern hayatın temposu, insanların 
                    bu deneyimi yaşamasını zorlaştırmıştı.
                  </p>
                  <p>
                    İşte Haldeki bu noktada devreye girdi. Halin o samimi atmosferini, 
                    tazeliği ve uygun fiyatları teknoloji ile birleştirerek herkesin 
                    evinden hal alışverişi yapabilmesini sağladık.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden bg-secondary">
                  <img 
                    src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=600&fit=crop"
                    alt="Taze meyve ve sebzeler"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-hover p-6">
                  <p className="text-3xl font-bold text-primary">2024</p>
                  <p className="text-sm text-muted-foreground">yılında kuruldu</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Değerlerimiz</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Haldekiyi özel kılan değerlerimiz, her gün yaptığımız işin temelini oluşturuyor.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <Card key={i} className="p-6 text-center card-hover">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-haldeki-green-light flex items-center justify-center">
                    <value.icon className="h-7 w-7 text-haldeki-green" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Ekibimiz</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Haldekiyi yaratmak ve büyütmek için tutkuyla çalışan ekibimiz.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {team.map((member, i) => (
                <Card key={i} className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-haldeki-green-light flex items-center justify-center">
                    <member.icon className="h-10 w-10 text-haldeki-green" />
                  </div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Award className="h-12 w-12 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl font-bold mb-6">Misyonumuz</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Türkiyedeki her eve en taze, en kaliteli meyve ve sebzeleri 
                en uygun fiyatlarla ulaştırmak. Üreticilerimizin emeğine değer katmak, 
                tüketicilerimizin sağlıklı beslenmesine katkıda bulunmak ve 
                gıda israfını en aza indirmek için çalışıyoruz.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/urunler">
                    Alışverişe Başla
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/iletisim">Bize Ulaşın</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Hakkimizda;
