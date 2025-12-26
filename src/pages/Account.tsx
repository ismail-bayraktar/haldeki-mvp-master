import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Package, MapPin, LogOut, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header, Footer, MobileNav } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Address {
  id: string;
  title: string;
  fullAddress: string;
  phone: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  date: string;
  status: "delivered" | "preparing" | "cancelled";
  total: number;
  itemCount: number;
}

const Account = () => {
  const { user, isAuthenticated, logout, openAuthDrawer } = useAuth();
  
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Demo Kullanıcı",
    email: user?.email || "demo@haldeki.com",
    phone: "0532 123 45 67",
  });

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      title: "Ev",
      fullAddress: "Örnek Mahallesi, Örnek Sokak No:1 Daire:1, Kadıköy/İstanbul",
      phone: "0532 123 45 67",
      isDefault: true,
    },
    {
      id: "2",
      title: "İş",
      fullAddress: "Levent Mahallesi, Plaza Sokak No:5 Kat:3, Beşiktaş/İstanbul",
      phone: "0533 987 65 43",
      isDefault: false,
    },
  ]);

  const [orders] = useState<Order[]>([
    { id: "HD12345678", date: "2025-12-22", status: "delivered", total: 245.50, itemCount: 8 },
    { id: "HD12345677", date: "2025-12-20", status: "delivered", total: 189.00, itemCount: 5 },
    { id: "HD12345676", date: "2025-12-18", status: "cancelled", total: 320.75, itemCount: 12 },
  ]);

  const [isEditing, setIsEditing] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Hesabınıza Giriş Yapın</h1>
            <p className="text-muted-foreground mb-6">
              Siparişlerinizi ve adreslerinizi görüntülemek için giriş yapın.
            </p>
            <Button onClick={openAuthDrawer}>Giriş Yap</Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success("Profil güncellendi");
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
    toast.success("Adres silindi");
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    toast.success("Varsayılan adres güncellendi");
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "delivered": return { label: "Teslim Edildi", className: "bg-stock-plenty/10 text-stock-plenty" };
      case "preparing": return { label: "Hazırlanıyor", className: "bg-stock-limited/10 text-stock-limited" };
      case "cancelled": return { label: "İptal Edildi", className: "bg-destructive/10 text-destructive" };
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <section className="py-8 md:py-12 bg-secondary/30">
          <div className="container">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.name}</h1>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Siparişler</span>
                </TabsTrigger>
                <TabsTrigger value="addresses" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Adresler</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Profil Bilgileri</h2>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveProfile}>Kaydet</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>İptal</Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Sipariş Geçmişi</h2>
                  
                  {orders.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Henüz siparişiniz bulunmuyor</p>
                      <Button asChild>
                        <Link to="/urunler">Alışverişe Başla</Link>
                      </Button>
                    </Card>
                  ) : (
                    orders.map((order) => {
                      const status = getStatusLabel(order.status);
                      return (
                        <Card key={order.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="font-bold">{order.id}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.date).toLocaleDateString("tr-TR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })} • {order.itemCount} ürün
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{order.total.toFixed(2)}₺</p>
                              <Button variant="ghost" size="sm" className="text-primary">
                                Detay
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Kayıtlı Adresler</h2>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Yeni Adres
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className={`p-4 ${address.isDefault ? "border-primary" : ""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent" />
                            <span className="font-bold">{address.title}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{address.fullAddress}</p>
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                        {!address.isDefault && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0 mt-2"
                            onClick={() => handleSetDefault(address.id)}
                          >
                            Varsayılan yap
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Account;
