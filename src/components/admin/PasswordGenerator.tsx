import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import { generatePassword } from "@/utils/passwordUtils";
import { toast } from "sonner";

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
  length?: number;
}

export const PasswordGenerator = ({ onPasswordGenerated, length = 12 }: PasswordGeneratorProps) => {
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const password = generatePassword(length);
    setGeneratedPassword(password);
    onPasswordGenerated(password);
    setCopied(false);
  };

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success("Şifre kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleGenerate}
        className="w-full"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Otomatik Oluştur
      </Button>
      {generatedPassword && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <code className="flex-1 text-sm font-mono">{generatedPassword}</code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

