import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Mail, Send, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const [testEmail, setTestEmail] = useState("");
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Lütfen bir email adresi girin");
      return;
    }

    setIsTestingSend(true);
    setTestResult(null);

    try {
      console.log('[Settings] Testing email to:', testEmail);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          templateType: 'dealer_invite',
          to: testEmail,
          templateData: {
            dealerName: 'Test Bayi',
            contactName: 'Test Kullanıcı',
            regions: 'Menemen, Aliağa',
            signupUrl: `${window.location.origin}/giris?invite=test-invite-id`,
            email: testEmail
          }
        }
      });

      console.log('[Settings] Email test response:', { data, error });

      if (error) {
        console.error('[Settings] Email test error:', error);
        setTestResult({
          success: false,
          message: 'Email gönderilemedi',
          details: error.message || JSON.stringify(error)
        });
        toast.error("Email test başarısız: " + (error.message || 'Bilinmeyen hata'));
      } else {
        setTestResult({
          success: true,
          message: 'Email başarıyla gönderildi!',
          details: `Message ID: ${data?.messageId || 'N/A'}`
        });
        toast.success("Test emaili başarıyla gönderildi!");
      }
    } catch (err: any) {
      console.error('[Settings] Email test exception:', err);
      setTestResult({
        success: false,
        message: 'Beklenmeyen hata oluştu',
        details: err.message || String(err)
      });
      toast.error("Email test hatası: " + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsTestingSend(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Ayarları
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Genel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4 mt-4">
          {/* Email Konfigürasyonu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Konfigürasyonu
              </CardTitle>
              <CardDescription>
                Mevcut email altyapısı ve ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Provider</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Brevo (Sendinblue)</Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">API</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Gönderici Email</Label>
                  <code className="block bg-muted px-3 py-2 rounded text-sm">
                    bayraktarismail00@gmail.com
                  </code>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">API Tabanlı Email (SMTP değil)</p>
                    <p className="text-blue-800 dark:text-blue-200">
                      Bu sistem Brevo API kullanarak email gönderiyor. SMTP kullanmıyoruz.
                      Edge Function üzerinden doğrudan Brevo API'sine HTTP isteği yapılıyor.
                    </p>
                    <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                      <li><strong>BREVO_API_KEY</strong>: Supabase secrets'ta tanımlı</li>
                      <li><strong>Sender</strong>: Brevo'da doğrulanmış email adresi gerekli</li>
                      <li><strong>Edge Function</strong>: <code>send-email</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Şablonları */}
              <div className="space-y-2">
                <Label>Aktif Email Şablonları</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    { name: 'dealer_invite', label: 'Bayi Daveti' },
                    { name: 'supplier_invite', label: 'Tedarikçi Daveti' },
                    { name: 'offer_status', label: 'Teklif Durumu' },
                    { name: 'order_notification', label: 'Sipariş Bildirimi (Bayi)' },
                    { name: 'order_confirmation', label: 'Sipariş Onayı (Müşteri)' },
                  ].map((template) => (
                    <div key={template.name} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded">
                      <span className="text-sm">{template.label}</span>
                      <code className="text-xs text-muted-foreground">{template.name}</code>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Email Test
              </CardTitle>
              <CardDescription>
                Email altyapısını test edin (Bayi Daveti şablonu ile)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="testEmail">Test Email Adresi</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleTestEmail} 
                    disabled={isTestingSend || !testEmail}
                  >
                    {isTestingSend ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Test Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${testResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                        {testResult.message}
                      </p>
                      {testResult.details && (
                        <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {testResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Test senaryosu:</strong> Bayi daveti emaili gönderilecek</p>
                <p><strong>Gönderici:</strong> Haldeki &lt;bayraktarismail00@gmail.com&gt;</p>
              </div>
            </CardContent>
          </Card>

          {/* Sorun Giderme */}
          <Card>
            <CardHeader>
              <CardTitle>Sorun Giderme</CardTitle>
              <CardDescription>Email gönderiminde sorun yaşıyorsanız</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground w-4">1.</span>
                  <span><strong>BREVO_API_KEY</strong> secret'ının doğru tanımlandığından emin olun</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground w-4">2.</span>
                  <span>Brevo'da sender email adresinin <strong>doğrulanmış</strong> olduğunu kontrol edin</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground w-4">3.</span>
                  <span>Brevo hesabınızda günlük email limitinizi kontrol edin (Free: 300/gün)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground w-4">4.</span>
                  <span>Edge function loglarını kontrol edin (Supabase Dashboard → Edge Functions → Logs)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sistem Ayarları
              </CardTitle>
              <CardDescription>
                Genel sistem ayarları burada yer alacaktır.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Yakında: Bildirim, teslimat bölgeleri ayarları
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
