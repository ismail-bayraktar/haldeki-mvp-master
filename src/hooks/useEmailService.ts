import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject?: string;
  htmlContent?: string;
  templateType?: 'dealer_invite' | 'supplier_invite' | 'order_notification' | 'offer_status' | 'order_confirmation' | 'admin_new_application' | 'application_approved' | 'application_rejected';
  templateData?: Record<string, any>;
}

interface OrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
}

export const useEmailService = () => {
  const sendEmail = async (params: SendEmailParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: params
      });

      if (error) {
        console.error('[useEmailService] Error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[useEmailService] Exception:', err);
      return { success: false, error: err.message };
    }
  };

  const sendDealerInvite = async (
    email: string,
    dealerName: string,
    contactName: string,
    regionIds?: string[],
    inviteId?: string
  ) => {
    // Bölge ID'lerinden bölge isimlerini al
    let regionNames: string[] = [];
    if (regionIds && regionIds.length > 0) {
      const { data: regions } = await supabase
        .from('regions')
        .select('name')
        .in('id', regionIds);
      
      regionNames = regions?.map(r => r.name) || [];
    }

    // Token ile özel kayıt sayfasına yönlendir
    const signupUrl = inviteId 
      ? `${window.location.origin}/bayi-kayit?token=${inviteId}`
      : `${window.location.origin}/giris`;
      
    return sendEmail({
      to: email,
      toName: contactName,
      templateType: 'dealer_invite',
      templateData: {
        email,
        dealerName,
        contactName,
        regions: regionNames.length > 0 ? regionNames.join(', ') : undefined,
        signupUrl
      }
    });
  };

  const sendSupplierInvite = async (
    email: string,
    supplierName: string,
    contactName: string,
    inviteId?: string
  ) => {
    // Token ile özel kayıt sayfasına yönlendir
    const signupUrl = inviteId
      ? `${window.location.origin}/tedarikci-kayit?token=${inviteId}`
      : `${window.location.origin}/giris`;
      
    return sendEmail({
      to: email,
      toName: contactName,
      templateType: 'supplier_invite',
      templateData: {
        email,
        supplierName,
        contactName,
        signupUrl
      }
    });
  };

  const sendOfferStatusNotification = async (
    email: string,
    supplierName: string,
    productName: string,
    status: 'approved' | 'rejected',
    quantity: number,
    unit: string,
    price: number
  ) => {
    const dashboardUrl = `${window.location.origin}/supplier`;
    return sendEmail({
      to: email,
      toName: supplierName,
      templateType: 'offer_status',
      templateData: {
        supplierName,
        productName,
        status,
        quantity,
        unit,
        price,
        dashboardUrl
      }
    });
  };

  const sendOrderNotification = async (
    email: string,
    orderId: string,
    regionName: string,
    totalAmount: number
  ) => {
    const dashboardUrl = `${window.location.origin}/dealer`;
    return sendEmail({
      to: email,
      toName: 'Bayi',
      templateType: 'order_notification',
      templateData: {
        orderId,
        regionName,
        totalAmount,
        dashboardUrl
      }
    });
  };

  const sendOrderConfirmation = async (
    email: string,
    customerName: string,
    orderId: string,
    regionName: string,
    totalAmount: number,
    items: OrderItem[],
    address: string,
    deliveryNote?: string
  ) => {
    const siteUrl = window.location.origin;
    return sendEmail({
      to: email,
      toName: customerName,
      templateType: 'order_confirmation',
      templateData: {
        orderId,
        customerName,
        regionName,
        totalAmount,
        items,
        address,
        deliveryNote,
        siteUrl
      }
    });
  };

  // Yeni başvuru admin bildirimi
  const sendNewApplicationNotification = async (
    adminEmail: string,
    applicationType: 'dealer' | 'supplier',
    applicantName: string,
    applicantEmail: string,
    firmName: string
  ) => {
    const dashboardUrl = applicationType === 'dealer' 
      ? `${window.location.origin}/admin/dealers`
      : `${window.location.origin}/admin/suppliers`;
      
    return sendEmail({
      to: adminEmail,
      toName: 'Admin',
      templateType: 'admin_new_application',
      templateData: {
        applicationType: applicationType === 'dealer' ? 'Bayi' : 'Tedarikçi',
        applicantName,
        applicantEmail,
        firmName,
        dashboardUrl
      }
    });
  };

  // Başvuru onay bildirimi
  const sendApplicationApproved = async (
    email: string,
    name: string,
    applicationType: 'dealer' | 'supplier',
    firmName: string
  ) => {
    const dashboardUrl = applicationType === 'dealer'
      ? `${window.location.origin}/bayi`
      : `${window.location.origin}/tedarikci`;
      
    return sendEmail({
      to: email,
      toName: name,
      templateType: 'application_approved',
      templateData: {
        name,
        applicationType: applicationType === 'dealer' ? 'Bayi' : 'Tedarikçi',
        firmName,
        dashboardUrl
      }
    });
  };

  // Başvuru red bildirimi
  const sendApplicationRejected = async (
    email: string,
    name: string,
    applicationType: 'dealer' | 'supplier',
    firmName: string,
    reason?: string
  ) => {
    const contactUrl = `${window.location.origin}/iletisim`;
    
    return sendEmail({
      to: email,
      toName: name,
      templateType: 'application_rejected',
      templateData: {
        name,
        applicationType: applicationType === 'dealer' ? 'Bayi' : 'Tedarikçi',
        firmName,
        reason,
        contactUrl
      }
    });
  };

  return {
    sendEmail,
    sendDealerInvite,
    sendSupplierInvite,
    sendOfferStatusNotification,
    sendOrderNotification,
    sendOrderConfirmation,
    sendNewApplicationNotification,
    sendApplicationApproved,
    sendApplicationRejected
  };
};
