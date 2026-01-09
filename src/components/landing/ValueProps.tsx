import { Truck, Scale, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValueProp {
  icon: typeof Truck;
  title: string;
  description: string;
}

const valueProps: ValueProp[] = [
  {
    icon: Truck,
    title: "Halden Sofranıza",
    description:
      "Ürünlerimiz toptan halinden çıkar çikmaz aynı gün kapınıza gelir. Aracı yok, tazelik garantisi.",
  },
  {
    icon: Scale,
    title: "Şeffaf Fiyatlandırma",
    description:
      "Kg başına net fiyat. Gizli ücret, sürpriz yok. Ne görüyorsanız onu ödersiniz.",
  },
  {
    icon: Users,
    title: "Yerel Çiftçi Desteği",
    description:
      "İzmir'in çevre köylerinden ve üreticilerden doğrudan tedarik. Hem taze hem ekonomik.",
  },
];

export const ValueProps = ({ className }: { className?: string }) => {
  return (
    <section className={cn("py-12 md:py-16 bg-secondary/30", className)}>
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
          Neden Haldeki?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-sm border border-border text-center hover:shadow-card transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <prop.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {prop.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
