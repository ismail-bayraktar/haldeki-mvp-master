import { useState } from "react";
import { Bell, Mail, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Geçerli bir e-posta adresi girin");

interface RegionWaitlistProps {
  regionName: string;
  isOpen: boolean;
  onClose: () => void;
}

const RegionWaitlist = ({ regionName, isOpen, onClose }: RegionWaitlistProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast({
        title: "Hata",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call - in production this would save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    toast({
      title: "Başarılı!",
      description: `${regionName} bölgesi aktif olduğunda ${email} adresine bildirim göndereceğiz.`,
    });

    // Reset after 2 seconds
    setTimeout(() => {
      setEmail("");
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Bölge Bildirimi
          </DialogTitle>
          <DialogDescription>
            {regionName} bölgesi henüz aktif değil. Aktif olduğunda size haber verelim.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="p-3 rounded-full bg-stock-plenty/10 mb-4">
              <CheckCircle className="h-8 w-8 text-stock-plenty" />
            </div>
            <h3 className="font-bold text-lg mb-2">Kaydınız Alındı!</h3>
            <p className="text-muted-foreground text-sm">
              {regionName} bölgesi açıldığında e-posta ile bilgilendirileceğiniz.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{regionName}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-posta Adresiniz
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Kaydediliyor..." : "Bana Haber Ver"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Sadece bölge aktifleştiğinde bildirim alacaksınız. Spam göndermiyoruz.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegionWaitlist;
