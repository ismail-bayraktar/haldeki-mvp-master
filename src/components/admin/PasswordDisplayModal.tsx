import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PasswordDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  email: string;
  userName?: string;
}

export const PasswordDisplayModal = ({
  open,
  onOpenChange,
  password,
  email,
  userName,
}: PasswordDisplayModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Şifre kopyalandı");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `Email: ${email}\nŞifre: ${password}`;
    navigator.clipboard.writeText(text);
    toast.success("Tüm bilgiler kopyalandı");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Geçici Şifre</DialogTitle>
          <DialogDescription>
            {userName ? `${userName} için` : "Kullanıcı için"} geçici şifre oluşturuldu.
            Bu şifreyi kullanıcıya manuel olarak iletin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm font-mono">{email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Geçici Şifre</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-background p-2 rounded">
                  {password}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPassword}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Kullanıcı ilk giriş yaptığında şifresini değiştirmesi zorunludur.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyAll}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Tümünü Kopyala
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Tamam
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

