import { MapPin, ShoppingCart, Truck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StepProps {
  icon: typeof MapPin;
  title: string;
  description: string;
  stepNumber: number;
}

const Step = ({ icon: Icon, title, description, stepNumber }: StepProps) => (
  <div className="flex flex-col items-center text-center space-y-4 group">
    <div className="relative">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105">
        <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent text-accent-foreground font-bold text-sm md:text-base flex items-center justify-center shadow-lg">
        {stepNumber}
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="text-lg md:text-xl font-bold text-foreground">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const HowItWorks = () => {
  const steps = [
    {
      icon: MapPin,
      title: "Bölge Seç",
      description: "Yaşadığınız bölgeyi seçin, size özel ürünleri ve fiyatları görün.",
    },
    {
      icon: ShoppingCart,
      title: "Ürünleri Seç",
      description: "En taze meyve ve sebzeleri sepetinize ekleyin, aracılara para ödemeyin.",
    },
    {
      icon: Truck,
      title: "Kapına Gelsin",
      description: "Aynı gün ücretsiz teslimatla ürünleriniz taze taze kapınızda.",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Nasıl Çalışır?
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sadece 3 basit adımda halden sofranıza en taze ürünler
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-12">
          {steps.map((step, index) => (
            <Step
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              stepNumber={index + 1}
            />
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="default"
            className="touch-manipulation"
            asChild
          >
            <Link to="/urunler">
              Hemen Başla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
