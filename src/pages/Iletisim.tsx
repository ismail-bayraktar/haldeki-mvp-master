import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { Header, Footer, MobileNav } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const Iletisim = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Mesajınız gönderildi!",
      description: "En kısa sürede size dönüş yapacağız.",
    });
    
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Phone, label: "Telefon", value: "+90 212 XXX XX XX", href: "tel:+902121234567" },
    { icon: Mail, label: "E-posta", value: "destek@haldeki.com", href: "mailto:destek@haldeki.com" },
    { icon: MapPin, label: "Adres", value: "İstanbul, Türkiye", href: "#" },
    { icon: Clock, label: "Çalışma Saatleri", value: "Her gün 06:00 - 22:00", href: "#" },
  ];

  const faqs = [
    {
      question: "Minimum sipariş tutarı var mı?",
      answer: "Hayır, minimum sipariş tutarı zorunluluğumuz yoktur. Ancak 150₺ ve üzeri siparişlerde ücretsiz teslimat hizmetimizden yararlanabilirsiniz.",
    },
    {
      question: "Ürünler nereden temin ediliyor?",
      answer: "Tüm ürünlerimiz İstanbul'daki büyük hallerden (Bayrampaşa, Kadıköy vb.) günlük olarak temin edilmektedir. Ürünler sabah erken saatlerde halden alınır ve aynı gün içinde teslim edilir.",
    },
    {
      question: "Teslimat ne kadar sürer?",
      answer: "Siparişleriniz, seçtiğiniz teslimat slotuna göre aynı gün veya ertesi gün teslim edilir. Teslimat saatlerini sipariş sırasında seçebilirsiniz.",
    },
    {
      question: "Ürün iadesi yapabilir miyim?",
      answer: "Evet, teslimat sırasında ürünleri kontrol edebilirsiniz. Kalitesinden memnun olmadığınız ürünleri iade edebilir veya değiştirebilirsiniz. Teslimattan sonra 24 saat içinde bize ulaşmanız yeterlidir.",
    },
    {
      question: "Hangi bölgelere teslimat yapıyorsunuz?",
      answer: "Şu anda İstanbul'un Avrupa ve Anadolu yakasındaki seçili semtlere teslimat yapıyoruz. Teslimat bölgelerimizi sürekli genişletiyoruz.",
    },
    {
      question: "Ödeme seçenekleri nelerdir?",
      answer: "Kredi kartı, banka kartı ve kapıda ödeme seçeneklerimiz mevcuttur. Online ödemeleriniz SSL güvenlik sertifikası ile korunmaktadır.",
    },
    {
      question: "Fiyatlar neden değişiyor?",
      answer: "Hal fiyatları arz ve talebe göre günlük olarak değişmektedir. Biz de bu değişimleri size şeffaf bir şekilde yansıtıyoruz. 'Bugün Halde' bölümümüzde güncel fiyat değişimlerini takip edebilirsiniz.",
    },
    {
      question: "Toptan alım yapabilir miyim?",
      answer: "Evet, restoran, otel ve işletmeler için özel toptan fiyatlarımız mevcuttur. Kurumsal siparişler için bizimle iletişime geçebilirsiniz.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero */}
        <section className="bg-organic-pattern py-12 md:py-16">
          <div className="container">
            <div className="max-w-2xl animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Bizimle İletişime Geçin
              </h1>
              <p className="text-lg text-muted-foreground">
                Sorularınız, önerileriniz veya şikayetleriniz için bize ulaşabilirsiniz. 
                Size en kısa sürede dönüş yapacağız.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-8 border-b">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contactInfo.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:shadow-card transition-shadow"
                >
                  <div className="p-2 rounded-full bg-secondary shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm text-foreground truncate">{item.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Mesaj Gönderin
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        placeholder="Adınız Soyadınız"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+90 5XX XXX XX XX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu</Label>
                      <Input
                        id="subject"
                        placeholder="Mesajınızın konusu"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Mesajınız *</Label>
                    <Textarea
                      id="message"
                      placeholder="Mesajınızı buraya yazın..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Gönderiliyor..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Mesaj Gönder
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* FAQ Section */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Sık Sorulan Sorular
                  </h2>
                </div>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="bg-card border rounded-lg px-4 data-[state=open]:shadow-card"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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

export default Iletisim;
