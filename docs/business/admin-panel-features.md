# Admin Panel Özellikleri ve UI/UX İyileştirmeleri

## Genel Bakış

Admin panelinde bayi ve tedarikçi yönetimi için kapsamlı özellikler ve kullanıcı dostu arayüz iyileştirmeleri bulunmaktadır.

## Liste Yönetimi

### Otomatik Liste Yükleme

**Özellik:**
- Component mount olduğunda otomatik olarak `fetchAll()` çağrılır
- `useEffect` hook'u ile ilk yükleme yapılır
- Manuel yenileme butonu da mevcuttur

**Kod:**
```typescript
useEffect(() => {
  fetchAll();
}, [fetchAll]);
```

**Avantajlar:**
- Sayfa açıldığında veriler otomatik yüklenir
- Kullanıcı manuel yenileme yapmak zorunda kalmaz
- Güncel veriler her zaman görüntülenir

### Liste Güncelleme Mekanizması

**Durumlar:**
1. Direkt kayıt sonrası: Dialog kapanır, password modal açılır, modal kapandığında liste güncellenir
2. Davet iptali sonrası: Liste otomatik güncellenir
3. Onay/Red sonrası: Liste otomatik güncellenir
4. Aktif/Pasif toggle sonrası: Liste otomatik güncellenir

## Şifre Görme Özelliği

### Genel Bakış

Direkt kayıt yapılan bayi/tedarikçiler için geçici şifreler localStorage'da şifrelenmiş olarak saklanır ve admin istediğinde görüntüleyebilir.

### Şifre Saklama

**Mekanizma:**
- Direkt kayıt yapıldığında şifre `storeTemporaryPassword(userId, password)` ile localStorage'a kaydedilir
- Şifre XOR encryption ile şifrelenir (basit obfuscation)
- Key: `haldeki-temp-password-key` (varsayılan)

**Kod:**
```typescript
// useDealers.ts / useSuppliers.ts
if (functionData.userId && data.password) {
  const { storeTemporaryPassword } = await import('@/utils/passwordUtils');
  storeTemporaryPassword(functionData.userId, data.password);
}
```

### Şifre Görüntüleme

**UI:**
- Tabloda "Şifre Gör" butonu sadece direkt kayıt yapılanlar için görünür
- Buton tıklandığında `PasswordDisplayModal` açılır
- Şifre kopyalama butonu ile kolayca kopyalanabilir

**Kod:**
```typescript
{supplier.user_id && getTemporaryPassword(supplier.user_id) && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      const password = getTemporaryPassword(supplier.user_id!);
      if (password) {
        setTempPassword(password);
        setTempEmail(supplier.contact_email || supplier.email || '');
        setTempUserName(supplier.name);
        setPasswordModalOpen(true);
      }
    }}
  >
    <Key className="h-4 w-4 mr-1" />
    Şifre Gör
  </Button>
)}
```

**Güvenlik Notları:**
- Şifreler sadece admin panelinde görüntülenebilir
- localStorage'da şifrelenmiş olarak saklanır
- Şifre görüntüleme için kullanıcı ID kontrolü yapılır

## UI/UX İyileştirmeleri

### Tablo Formatı

**Kolonlar:**
- Firma Adı
- Yetkili (contact_name)
- İletişim (email, telefon)
- Bölgeler/Kategoriler
- Durum (Onay durumu + Aktif/Pasif badge'leri)
- Kayıt Tarihi
- İşlemler (Bölge Düzenle, Şifre Gör, Aktif/Pasif Toggle)

**Durum Badge'leri:**
- Onay Bekliyor: Sarı (yellow-100, yellow-800)
- Onaylandı: Yeşil (green-600, white)
- Reddedildi: Kırmızı (destructive variant)
- Aktif: Yeşil (green-700, white)
- Pasif: Gri (secondary variant)

### Bölge Ürünleri Toggle

**Özellik:**
- Tabloda direkt aktif/pasif toggle switch'i
- Switch değiştiğinde direkt `updateMutation.mutate` çağrılır
- Badge ile görsel geri bildirim

**Kod:**
```typescript
<Switch
  checked={rp.is_active}
  onCheckedChange={(checked) => {
    if (!selectedRegionId) return;
    updateMutation.mutate({
      id: rp.id,
      regionId: selectedRegionId,
      price: rp.price,
      previous_price: rp.previous_price,
      stock_quantity: rp.stock_quantity,
      availability: rp.availability,
      is_active: checked,
    });
  }}
  disabled={updateMutation.isPending}
/>
```

## Sayfa Yenilenme Sorunu Çözümü

### Sorun

Sayfa focus/blur olduğunda veya farklı tab'a geçildiğinde sayfa yenileniyor, sepet ve dashboard sıfırlanıyordu.

### Çözüm

**CartContext localStorage Persistence:**
- Sepet verileri localStorage'a kaydedilir
- Sayfa yenilendiğinde veya tab değiştiğinde sepet restore edilir
- `visibilitychange` event listener ile sync yapılır

**Kod:**
```typescript
// CartContext.tsx
const CART_STORAGE_KEY = 'haldeki_cart_items';

// Load cart from localStorage on mount
useEffect(() => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[];
      if (isAuthenticated && selectedRegion) {
        setItems(parsed);
      }
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  setIsHydrated(true);
}, []);

// Save cart to localStorage whenever items change
useEffect(() => {
  if (!isHydrated) return;
  
  try {
    if (items.length > 0 && isAuthenticated && selectedRegion) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}, [items, isHydrated, isAuthenticated, selectedRegion]);

// Sync cart when page becomes visible
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isAuthenticated && selectedRegion) {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CartItem[];
          if (JSON.stringify(parsed) !== JSON.stringify(items)) {
            setItems(parsed);
          }
        }
      } catch (error) {
        console.error('Error syncing cart on visibility change:', error);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [items, isAuthenticated, selectedRegion]);
```

**Avantajlar:**
- Sepet verileri kaybolmaz
- Tab değişiminde sepet korunur
- Sayfa yenilendiğinde sepet restore edilir
- Sadece authenticated kullanıcılar ve bölge seçiliyse sepet restore edilir

## Dialog ve Modal Yönetimi

### Dialog Kapatma

**Direkt Kayıt Sonrası:**
1. Kayıt başarılı olur
2. Dialog kapatılır (`setIsInviteDialogOpen(false)`)
3. Password modal açılır
4. Password modal kapandığında liste güncellenir (`fetchAll()`)

**Kod:**
```typescript
if (result.success) {
  setIsInviteDialogOpen(false);
  setTempPassword(result.password || directForm.password);
  setTempEmail(directForm.email);
  setTempUserName(directForm.name);
  setPasswordModalOpen(true);
  // ... form reset
  await fetchAll();
}

// Password modal onOpenChange
<PasswordDisplayModal
  open={passwordModalOpen}
  onOpenChange={(open) => {
    setPasswordModalOpen(open);
    if (!open) {
      fetchAll();
    }
  }}
  // ...
/>
```

## Önemli Notlar

1. **Şifre Görme:** Sadece direkt kayıt yapılanlar için mevcuttur
2. **Liste Yükleme:** Otomatik yüklenir, manuel yenileme de mevcuttur
3. **Sepet Persistence:** localStorage ile korunur, visibility sync ile güncellenir
4. **UI İyileştirmeleri:** Tablo formatı, badge'ler, toggle switch'ler ile kullanıcı deneyimi iyileştirildi

