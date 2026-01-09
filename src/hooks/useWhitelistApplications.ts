import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhitelistApplication } from "@/types";

export const useWhitelistApplications = () => {
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whitelist_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching whitelist applications:', error);
      toast.error('Başvurular yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveApplication = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whitelist_applications')
        .update({
          status: 'approved',
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Başvuru onaylandı');
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Onaylama sırasında hata oluştu');
      return false;
    }
  };

  const rejectApplication = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whitelist_applications')
        .update({
          status: 'rejected',
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Başvuru reddedildi');
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Reddetme sırasında hata oluştu');
      return false;
    }
  };

  const markDuplicate = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whitelist_applications')
        .update({
          status: 'duplicate',
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Kopya olarak işaretlendi');
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error marking duplicate:', error);
      toast.error('İşlem sırasında hata oluştu');
      return false;
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');
  const duplicateApps = applications.filter(a => a.status === 'duplicate');

  return {
    applications,
    pendingApps,
    approvedApps,
    rejectedApps,
    duplicateApps,
    isLoading,
    fetchAll,
    approveApplication,
    rejectApplication,
    markDuplicate,
  };
};
