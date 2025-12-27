import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const brevoApiKey = Deno.env.get("BREVO_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");

// Allowed origins for CORS - allow all origins for MVP testing
const getCorsHeaders = (origin: string | null): Record<string, string> => {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};


interface EmailRequest {
  to: string;
  toName?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateType?: 'dealer_invite' | 'supplier_invite' | 'order_notification' | 'offer_status' | 'order_confirmation' | 'admin_new_application' | 'application_approved' | 'application_rejected';
  templateData?: Record<string, any>;
}

// HTML escape function to prevent XSS attacks
const escapeHtml = (str: string | undefined | null): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Email template'leri
const getEmailTemplate = (type: string, data: Record<string, any>) => {
  // Escape all user-provided data
  const safeData = {
    contactName: escapeHtml(data.contactName),
    dealerName: escapeHtml(data.dealerName),
    supplierName: escapeHtml(data.supplierName),
    productName: escapeHtml(data.productName),
    regions: escapeHtml(data.regions),
    regionName: escapeHtml(data.regionName),
    email: escapeHtml(data.email),
    quantity: escapeHtml(String(data.quantity || '')),
    unit: escapeHtml(data.unit),
    price: escapeHtml(String(data.price || '')),
    totalAmount: escapeHtml(String(data.totalAmount || '')),
    orderId: escapeHtml(data.orderId),
    customerName: escapeHtml(data.customerName),
    address: escapeHtml(data.address),
    deliveryNote: escapeHtml(data.deliveryNote),
    // URLs are validated as they should be internal application URLs
    signupUrl: data.signupUrl || '',
    dashboardUrl: data.dashboardUrl || '',
    siteUrl: data.siteUrl || '',
    status: data.status, // Used for conditional logic, not displayed directly
    items: data.items, // Array, processed separately
  };

  switch (type) {
    case 'dealer_invite':
      return {
        subject: 'Haldeki - Bayi Daveti',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 8px 0 0; opacity: 0.9; }
              .logo-icon { width: 48px; height: 48px; margin-bottom: 12px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #22c55e; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
              .warning-text { color: #666; font-size: 14px; background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/>
                </svg>
                <h1>Haldeki</h1>
                <p>Taze Meyve & Sebze Platformu</p>
              </div>
              <div class="content">
                <h2>Merhaba ${safeData.contactName || 'Değerli Bayimiz'},</h2>
                <p><strong>${safeData.dealerName}</strong> firması olarak Haldeki ailesine katılmaya davet edildiniz!</p>
                
                <div class="info-box">
                  <strong>Firma Bilgileri:</strong><br>
                  Firma Adı: ${safeData.dealerName}<br>
                  ${safeData.regions ? `Hizmet Bölgeleri: ${safeData.regions}` : ''}
                </div>
                
                <p>Bayi panelinize erişmek için aşağıdaki butona tıklayarak kayıt olun:</p>
                
                <center>
                  <a href="${safeData.signupUrl}" class="button" style="color: #ffffff;">Kayıt Ol ve Başla</a>
                </center>
                
                <div class="warning-text">
                  <strong>Önemli:</strong> Bu davet 7 gün içinde geçerliliğini yitirecektir.<br>
                  Kayıt olurken bu email adresini (<strong>${safeData.email}</strong>) kullanmanız gerekmektedir.
                </div>
              </div>
              <div class="footer">
                <p>Bu email Haldeki platformu tarafından gönderilmiştir.</p>
                <p>© 2025 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
    case 'supplier_invite':
      return {
        subject: 'Haldeki - Tedarikçi Daveti',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f97316; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍎 Haldeki</h1>
                <p>Tedarikçi Platformu</p>
              </div>
              <div class="content">
                <h2>Merhaba ${safeData.contactName || 'Değerli Tedarikçimiz'},</h2>
                <p><strong>${safeData.supplierName}</strong> firması olarak Haldeki tedarikçi ağına katılmaya davet edildiniz!</p>
                
                <div class="info-box">
                  <strong>Firma Bilgileri:</strong><br>
                  Firma Adı: ${safeData.supplierName}
                </div>
                
                <p>Tedarikçi panelinize erişmek için aşağıdaki butona tıklayarak kayıt olun:</p>
                
                <center>
                  <a href="${safeData.signupUrl}" class="button">Kayıt Ol ve Teklif Ver</a>
                </center>
                
                <p style="color: #666; font-size: 14px;">
                  ⚠️ Bu davet 7 gün içinde geçerliliğini yitirecektir.<br>
                  Kayıt olurken bu email adresini (${safeData.email}) kullanmanız gerekmektedir.
                </p>
              </div>
              <div class="footer">
                <p>Bu email Haldeki platformu tarafından gönderilmiştir.</p>
                <p>© 2024 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'offer_status':
      const statusText = safeData.status === 'approved' ? 'Onaylandı ✅' : 'Reddedildi ❌';
      const statusColor = safeData.status === 'approved' ? '#22c55e' : '#ef4444';
      return {
        subject: `Haldeki - Teklifiniz ${statusText}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #333; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColor}; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Teklif Durumu</h1>
                <p>${statusText}</p>
              </div>
              <div class="content">
                <h2>Merhaba ${safeData.supplierName},</h2>
                <p><strong>${safeData.productName}</strong> ürünü için verdiğiniz teklif ${safeData.status === 'approved' ? 'onaylanmıştır' : 'reddedilmiştir'}.</p>
                
                <div class="info-box">
                  <strong>Teklif Detayları:</strong><br>
                  Ürün: ${safeData.productName}<br>
                  Miktar: ${safeData.quantity} ${safeData.unit}<br>
                  Fiyat: ₺${safeData.price}/${safeData.unit}
                </div>
                
                ${safeData.status === 'approved' ? 
                  '<p>Tebrikler! Teklifiniz kabul edildi. En kısa sürede sizinle iletişime geçeceğiz.</p>' : 
                  '<p>Teklifiniz bu sefer değerlendirilemedi. Yeni teklifler için panelimizi ziyaret edebilirsiniz.</p>'
                }
                
                <center>
                  <a href="${safeData.dashboardUrl}" class="button">Panele Git</a>
                </center>
              </div>
              <div class="footer">
                <p>© 2024 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'order_notification':
      return {
        subject: 'Haldeki - Yeni Sipariş Bildirimi',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 Yeni Sipariş</h1>
              </div>
              <div class="content">
                <h2>Yeni bir sipariş alındı!</h2>
                
                <div class="info-box">
                  <strong>Sipariş Detayları:</strong><br>
                  Sipariş No: #${safeData.orderId?.slice(0, 8) || ''}<br>
                  Bölge: ${safeData.regionName}<br>
                  Toplam: ₺${safeData.totalAmount}
                </div>
                
                <center>
                  <a href="${safeData.dashboardUrl}" class="button">Siparişi Görüntüle</a>
                </center>
              </div>
              <div class="footer">
                <p>© 2024 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'order_confirmation':
      // Format items list if provided
      const itemsList = data.items ? data.items.map((item: any) => 
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.productName)}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${escapeHtml(String(item.quantity))}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₺${escapeHtml(String(item.totalPrice?.toFixed(2) || '0'))}</td></tr>`
      ).join('') : '';
      
      return {
        subject: `Haldeki - Siparişiniz Alındı #${safeData.orderId?.slice(0, 8) || ''}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
              .items-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
              .items-table th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; }
              .total-row { font-weight: bold; background: #f0fdf4; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Siparişiniz Alındı</h1>
                <p>Teşekkür ederiz!</p>
              </div>
              <div class="content">
                <h2>Merhaba ${safeData.customerName || 'Değerli Müşterimiz'},</h2>
                <p>Siparişiniz başarıyla oluşturuldu. Siparişinizi en kısa sürede hazırlayacağız.</p>
                
                <div class="info-box">
                  <strong>Sipariş Bilgileri:</strong><br>
                  Sipariş No: #${safeData.orderId?.slice(0, 8) || ''}<br>
                  Bölge: ${safeData.regionName}<br>
                  ${safeData.deliveryNote ? `Teslimat: ${escapeHtml(safeData.deliveryNote)}<br>` : ''}
                  Teslimat Adresi: ${safeData.address || ''}
                </div>
                
                ${itemsList ? `
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th style="text-align: center;">Adet</th>
                      <th style="text-align: right;">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                    <tr class="total-row">
                      <td colspan="2" style="padding: 12px 8px;">Toplam</td>
                      <td style="padding: 12px 8px; text-align: right;">₺${safeData.totalAmount}</td>
                    </tr>
                  </tbody>
                </table>
                ` : `
                <div class="info-box">
                  <strong>Toplam Tutar:</strong> ₺${safeData.totalAmount}
                </div>
                `}
                
                <p style="margin-top: 20px;">Siparişiniz hakkında sorularınız için bizimle iletişime geçebilirsiniz.</p>
                
                <center>
                  <a href="${safeData.siteUrl || 'https://haldekimvp.lovable.app'}" class="button">Sitemizi Ziyaret Edin</a>
                </center>
              </div>
              <div class="footer">
                <p>Bu email siparişiniz ile ilgili olarak gönderilmiştir.</p>
                <p>© 2024 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'admin_new_application':
      return {
        subject: `Haldeki - Yeni ${escapeHtml(data.applicationType)} Başvurusu`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #6366f1; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #6366f1; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Yeni ${escapeHtml(data.applicationType)} Başvurusu</h1>
              </div>
              <div class="content">
                <h2>Yeni bir başvuru alındı!</h2>
                
                <div class="info-box">
                  <strong>Başvuru Detayları:</strong><br>
                  Tür: ${escapeHtml(data.applicationType)}<br>
                  Firma: ${escapeHtml(data.firmName)}<br>
                  Yetkili: ${escapeHtml(data.applicantName)}<br>
                  Email: ${escapeHtml(data.applicantEmail)}
                </div>
                
                <p>Bu başvuruyu incelemek ve onaylamak/reddetmek için admin paneline gidin:</p>
                
                <center>
                  <a href="${data.dashboardUrl || ''}" class="button" style="color: #ffffff;">Başvuruyu İncele</a>
                </center>
              </div>
              <div class="footer">
                <p>© 2025 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'application_approved':
      return {
        subject: 'Haldeki - Başvurunuz Onaylandı!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #22c55e; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Tebrikler!</h1>
                <p>Başvurunuz Onaylandı</p>
              </div>
              <div class="content">
                <h2>Merhaba ${escapeHtml(data.name)},</h2>
                <p><strong>${escapeHtml(data.firmName)}</strong> firmanızın ${escapeHtml(data.applicationType)} başvurusu onaylanmıştır!</p>
                
                <div class="info-box">
                  <strong>Artık Haldeki ailesinin bir parçasısınız!</strong><br>
                  ${escapeHtml(data.applicationType)} panelinize giriş yaparak işlemlerinize başlayabilirsiniz.
                </div>
                
                <center>
                  <a href="${data.dashboardUrl || ''}" class="button" style="color: #ffffff;">Panele Git</a>
                </center>
              </div>
              <div class="footer">
                <p>© 2025 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'application_rejected':
      return {
        subject: 'Haldeki - Başvurunuz Hakkında',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #6b7280; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Başvuru Sonucu</h1>
              </div>
              <div class="content">
                <h2>Merhaba ${escapeHtml(data.name)},</h2>
                <p><strong>${escapeHtml(data.firmName)}</strong> firmanızın ${escapeHtml(data.applicationType)} başvurusu şu anda onaylanamamıştır.</p>
                
                ${data.reason ? `
                <div class="info-box">
                  <strong>Açıklama:</strong><br>
                  ${escapeHtml(data.reason)}
                </div>
                ` : ''}
                
                <p>Daha fazla bilgi almak veya yeniden başvurmak için bizimle iletişime geçebilirsiniz.</p>
                
                <center>
                  <a href="${data.contactUrl || ''}" class="button" style="color: #ffffff;">İletişime Geç</a>
                </center>
              </div>
              <div class="footer">
                <p>© 2025 Haldeki. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, toName, subject, htmlContent, templateType, templateData }: EmailRequest = await req.json();
    
    console.log(`[send-email] Sending email to: ${to}, type: ${templateType || 'custom'}`);

    let emailSubject = subject;
    let emailHtml = htmlContent;

    // Template kullanılıyorsa
    if (templateType && templateData) {
      const template = getEmailTemplate(templateType, templateData);
      if (template) {
        emailSubject = template.subject;
        emailHtml = template.html;
      }
    }

    if (!emailSubject || !emailHtml) {
      throw new Error('Subject and HTML content are required');
    }

    // Brevo API ile email gönder
    console.log('[send-email] Preparing Brevo request...');
    console.log('[send-email] API Key exists:', !!brevoApiKey);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Haldeki',
          email: 'bayraktarismail00@gmail.com'
        },
        to: [{ email: to, name: toName || to }],
        subject: emailSubject,
        htmlContent: emailHtml,
        params: {
          trackOpens: false,
          trackClicks: false
        }
      }),
    });

    const result = await response.json();
    console.log('[send-email] Brevo response status:', response.status);
    console.log('[send-email] Brevo response:', JSON.stringify(result));

    if (!response.ok) {
      console.error('[send-email] Brevo API error:', result);
      throw new Error(result.message || result.code || 'Failed to send email');
    }

    console.log('[send-email] Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
