import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

type AppRole = 'superadmin' | 'admin' | 'dealer' | 'supplier' | 'user';

const ALL_ROLES: AppRole[] = ['superadmin', 'admin', 'dealer', 'supplier', 'user'];

const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (role) {
    case 'superadmin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'dealer':
    case 'supplier':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'superadmin':
      return 'Süper Admin';
    case 'admin':
      return 'Admin';
    case 'dealer':
      return 'Bayi';
    case 'supplier':
      return 'Tedarikçi';
    case 'user':
      return 'Kullanıcı';
    default:
      return role;
  }
};

const AdminUsers = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Role management dialog state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = profiles;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(profile => {
        const roles = userRoles[profile.id] || [];
        return roles.includes(roleFilter);
      });
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, roleFilter, userRoles]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap: Record<string, string[]> = {};
      (rolesData || []).forEach((ur: { user_id: string; role: string }) => {
        if (!rolesMap[ur.user_id]) {
          rolesMap[ur.user_id] = [];
        }
        rolesMap[ur.user_id].push(ur.role);
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const openRoleDialog = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setPendingRoles([...(userRoles[userId] || [])]);
    setDialogOpen(true);
  };

  const togglePendingRole = (role: AppRole) => {
    const isSelf = selectedUserId === currentUser?.id;
    
    // Self-lock protection: prevent removing own admin/superadmin role
    if (isSelf && ['admin', 'superadmin'].includes(role) && pendingRoles.includes(role)) {
      toast.error("Kendi yönetici rolünüzü kaldıramazsınız");
      return;
    }

    // Admin cannot add/remove superadmin role
    if (role === 'superadmin' && !isSuperAdmin) {
      toast.error("Superadmin rolünü sadece superadmin atayabilir");
      return;
    }

    setPendingRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const saveRoles = async () => {
    if (!selectedUserId) return;

    const currentRoles = userRoles[selectedUserId] || [];
    const rolesToAdd = pendingRoles.filter(r => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter(r => !pendingRoles.includes(r));

    // Final security check
    const isSelf = selectedUserId === currentUser?.id;
    if (isSelf && rolesToRemove.some(r => ['admin', 'superadmin'].includes(r))) {
      toast.error("Kendi yönetici rolünüzü kaldıramazsınız");
      return;
    }

    if (!isSuperAdmin) {
      if (rolesToAdd.includes('superadmin') || rolesToRemove.includes('superadmin')) {
        toast.error("Superadmin rolünü sadece superadmin değiştirebilir");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Remove roles
      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUserId)
          .eq('role', role as 'admin' | 'dealer' | 'superadmin' | 'supplier' | 'user');

        if (error) throw error;
      }

      // Add roles
      for (const role of rolesToAdd) {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: selectedUserId, role: role as 'admin' | 'dealer' | 'superadmin' | 'supplier' | 'user' }]);

        if (error) throw error;
      }

      toast.success('Roller güncellendi');
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving roles:', error);
      if (error.message?.includes('row-level security')) {
        toast.error('Bu işlem için yetkiniz yok');
      } else {
        toast.error('Roller güncellenirken hata oluştu');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kullanıcılar</h1>
          <p className="text-muted-foreground">Tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya email ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Roller</SelectItem>
            <SelectItem value="superadmin">Süper Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="dealer">Bayi</SelectItem>
            <SelectItem value="supplier">Tedarikçi</SelectItem>
            <SelectItem value="user">Kullanıcı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredProfiles.length} kullanıcı
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {profiles.length === 0 ? "Henüz kullanıcı yok" : "Aramayla eşleşen kullanıcı bulunamadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Roller</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => {
                    const roles = userRoles[profile.id] || [];

                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || '-'}
                        </TableCell>
                        <TableCell>{profile.email || '-'}</TableCell>
                        <TableCell>{profile.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {roles.length > 0 ? (
                              roles.map(role => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role)}
                                >
                                  {getRoleLabel(role)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Rol yok</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedUserId === profile.id} onOpenChange={(open) => {
                            if (!open) setDialogOpen(false);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(profile.id, profile.email || '')}
                              >
                                <Settings2 className="h-4 w-4 mr-1" />
                                Rol Yönet
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rol Yönetimi</DialogTitle>
                                <DialogDescription>
                                  {selectedUserEmail} için rolleri düzenleyin
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {ALL_ROLES.map(role => {
                                  const isChecked = pendingRoles.includes(role);
                                  const isSelf = selectedUserId === currentUser?.id;
                                  const isCriticalSelfRole = isSelf && ['admin', 'superadmin'].includes(role) && isChecked;
                                  const isSuperadminRestricted = role === 'superadmin' && !isSuperAdmin;

                                  return (
                                    <div key={role} className="flex items-center space-x-3">
                                      <Checkbox
                                        id={`role-${role}`}
                                        checked={isChecked}
                                        disabled={isCriticalSelfRole || isSuperadminRestricted}
                                        onCheckedChange={() => togglePendingRole(role)}
                                      />
                                      <label
                                        htmlFor={`role-${role}`}
                                        className={`flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${
                                          isCriticalSelfRole || isSuperadminRestricted ? 'opacity-50' : ''
                                        }`}
                                      >
                                        <Badge variant={getRoleBadgeVariant(role)}>
                                          {getRoleLabel(role)}
                                        </Badge>
                                        {isCriticalSelfRole && (
                                          <span className="text-xs text-muted-foreground">(Kendi rolünüz)</span>
                                        )}
                                        {isSuperadminRestricted && (
                                          <span className="text-xs text-muted-foreground">(Sadece Superadmin)</span>
                                        )}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                  İptal
                                </Button>
                                <Button onClick={saveRoles} disabled={isSaving}>
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Kaydediliyor...
                                    </>
                                  ) : (
                                    'Kaydet'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
