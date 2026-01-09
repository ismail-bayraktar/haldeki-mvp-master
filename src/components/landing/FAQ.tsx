import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Haldekcom nedir ve nasıl çalışır?",
    answer:
      "Haldekcom, İzmir'de taze meyve sebze teslimatı yapan dijital bir platformdur. Yerel çiftçilerden tedarik ettiğimiz ürünleri toptan hal fiyatlarıyla aynı gün kapınıza getiriyoruz. Online sipariş verin, hazırlanan ürünleriniz seçtiğiniz saatte teslim edilsin.",
  },
  {
    question: "Hangi bölgelere teslimat yapıyorsunuz?",
    answer:
      "Pilot aşamada İzmir merkez (Konak, Karşıyaka, Bornova, Buca, Balçova, Gaziemir, Narlıdere) ve çevre ilçelerine (Menemen, Aliağa) teslimat yapıyoruz. Yakında daha fazla bölgeye yayılacağız.",
  },
  {
    question: "Teslimat ücreti ne kadar?",
    answer:
      "Pilot kullanıcılar için 150 TL üzeri siparişlerde teslimat ücretsizdir. Alt siparişlerde 15 TL teslimat ücreti uygulanır. Erken erişim listesine katılanlara özel min sipariş tutarı şartı olmadan ücretsiz teslimat sunuyoruz.",
  },
  {
    question: "Ödeme seçenekleri neler?",
    answer:
      "Kapıda nakit/kredi kartı ve online EFT/Havale seçeneklerimiz mevcuttur. Pilot aşamada online ödeme sistemi de test edilecektir.",
  },
  {
    question: "Ürünler ne kadar taze? Kalite garantisi var mı?",
    answer:
      "Ürünlerimiz her sabah toptan halden taze olarak çıkar çikmaz teslim alınır. Aynı gün içinde dağıtım yapılır. Memnun kalmadığınız ürünler için koşulsuz iade/değişim hakkınız vardır.",
  },
];

export const FAQ = ({ className }: { className?: string }) => {
  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
          Sık Sorulan Sorular
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-card border rounded-lg px-4 data-[state=open]:shadow-card"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
