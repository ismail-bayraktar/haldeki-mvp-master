import { MapPin, Truck, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ServiceAreaMap = () => {
  const areas = [
    {
      name: "Menemen",
      districts: ["Merkez", "Ulukent", "Seyrek", "Türkelli", "Emiralem"],
      minOrder: 150,
      deliveryFee: "Ücretsiz",
      link: "/menemen-taze-sebze-meyve",
    },
    {
      name: "Aliağa",
      districts: ["Merkez", "Çakmaklı", "Güzelhisar", "Helvacı", "Samurlu"],
      minOrder: 150,
      deliveryFee: "Ücretsiz",
      link: "/aliaga-taze-sebze-meyve",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Teslimat Bölgelerimiz
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            İzmir Menemen ve Aliağa bölgelerine aynı gün taze meyve sebze teslimatı yapıyoruz
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Google Maps Embed */}
          <div className="rounded-xl overflow-hidden shadow-lg h-[300px] md:h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d195884.63892612447!2d26.8847252!3d38.9465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14b9a5d0a77bb6bf%3A0x2c6a6f1d8c6c6a6b!2sMenemen%2C%20%C4%B0zmir!5e0!3m2!1str!2str!4v1703425200000!5m2!1str!2str"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Haldeki Teslimat Bölgeleri - Menemen ve Aliağa"
            />
          </div>

          {/* Area Cards */}
          <div className="space-y-4">
            {areas.map((area) => (
              <div
                key={area.name}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {area.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {area.districts.join(", ")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={area.link}>Detaylar</Link>
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>
                      <strong>{area.minOrder}₺</strong> min. sipariş
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Aynı gün teslimat</span>
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {area.deliveryFee} Teslimat
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Bölgeniz listede yok mu?{" "}
            <Link to="/iletisim" className="text-primary font-medium hover:underline">
              Bize bildirin
            </Link>
            , yakında sizin bölgenize de gelelim!
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreaMap;
