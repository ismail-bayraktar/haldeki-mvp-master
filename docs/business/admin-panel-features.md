# Admin Panel Özellikleri ve UI/UX İyileştirmeleri

## Genel Bakış

Admin panelinde bayi, tedarikçi ve işletme yönetimi için kapsamlı özellikler ve kullanıcı dostu arayüz iyileştirmeleri bulunmaktadır. Faz 10 ile birlikte tedarikçilerin ürün içe/dışa aktarma işlemlerini takip edebileceği audit log sistemi eklenmiştir.

## Liste Yönetimi

### Otomatik Liste Yükleme

**Özellik:**
- Component mount olduğunda otomatik olarak `fetchAll()` çağrılır
- `useEffect` hook'u ile ilk yükleme yapılır
- Manuel yenileme butonu da mevcuttur

### Sekmeli (Tabbed) Yönetim Yapısı (YENİ)

Admin panelinde Bayi, Tedarikçi ve İşletme yönetimi için üç aşamalı sekmeli yapıya geçilmiştir:

1. **Onay Bekleyenler (Action Inbox):** Yeni kayıt olan ancak henüz onaylanmamış başvurular burada kart bazlı, yüksek vurgulu ve direkt "Onayla/Reddet" butonlarıyla listelenir.
2. **Aktif Liste:** Onaylanmış veya reddedilmiş tüm kayıtların bulunduğu, detaylı arama ve filtreleme destekli ana tablodur.
3. **Bekleyen Davetler:** Henüz kayıt formunu doldurmamış, sadece email daveti gönderilmiş kayıtlar burada izlenir.

**Avantajlar:**
- Operasyonel odaklanma: Admin direkt olarak bekleyen işleri görür.
- Temiz UI: Veri kalabalığı sekmelerle ayrıştırılmıştır.
- Hızlı Aksiyon: Onay ve red işlemleri için minimum tıklama hedeflenmiştir.

## Şifre Görme Özelliği

### Genel Bakış

Direkt kayıt yapılan bayi/tedarikçiler için geçici şifreler localStorage'da şifrelenmiş olarak saklanır ve admin istediğinde görüntüleyebilir.

### Şifre Saklama

**Mekanizma:**
- Direkt kayıt yapıldığında şifre `storeTemporaryPassword(userId, password)` ile localStorage'a kaydedilir
- Şifre XOR encryption ile şifrelenir (basit obfuscation)
- Key: `haldeki-temp-password-key` (varsayılan)

### Şifre Görüntüleme

**UI:**
- Tabloda "Şifre Gör" butonu (Anahtar ikonu) sadece direkt kayıt yapılanlar için görünür.
- Buton tıklandığında `PasswordDisplayModal` açılır.
- Şifre kopyalama butonu ile kolayca kopyalanabilir.

## UI/UX İyileştirmeleri

### Liste Tasarımı

**Aksiyonlar:**
- **Onayla/Reddet:** Bekleyen başvurular için hızlı karar butonları.
- **Bölge Düzenle (Bayi):** Bayinin hizmet verdiği bölgeleri anında güncelleme.
- **Aktif/Pasif:** Kayıtlı kullanıcıları sistemden anında devre dışı bırakma.
- **Şifre Gör:** Kayıt sonrası unutulan geçici şifreleri kurtarma.

**Görsel Göstergeler:**
- **Status Badge'leri:** Onaylı (Yeşil), Bekliyor (Sarı), Reddedildi (Kırmızı).
- **Aktiflik Badge'leri:** Aktif (Koyu Yeşil), Pasif (Gri).
- **Kategori Badge'leri (Tedarikçi):** Uzmanlık alanlarını gösteren mor/yeşil etiketler.
- **Özet Kartları:** Sayfanın en üstünde toplam sayıları gösteren renkli istatistik kartları.

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

## Tedarikçi İçe/Dışa Aktarma Yönetimi (Faz 10)

### Import Geçmişi

Admin panelinde tedarikçilerin ürün içe aktarma işlemlerini takip edebilirsiniz:

**Görüntülenen Bilgiler:**
- Dosya adı ve boyutu
- Toplam satır sayısı
- Başarılı/başarısız satır sayısı
- İçe aktarma durumu (pending, processing, completed, failed, rolled_back)
- Hata detayları (errors JSONB)
- İşlem tarihi

**Özellikler:**
- [x] Tüm tedarikçi import kayıtlarını görüntüleme
- [x] Durum bazlı filtreleme
- [x] Hata detaylarını görüntüleme
- [x] Rollback işlemlerini izleme
- [x] Performans metrikleri (ortalama işlem süresi)

**RLS Politikası:**
```sql
-- Admin tüm import kayıtlarını görebilir
CREATE POLICY "Admins can view all imports"
ON product_imports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

### Audit Log

Tüm içe aktarma işlemleri `product_imports` tablosunda kayıt altına alınır:

**Kayıt Edilen Veriler:**
```json
{
  "id": "uuid",
  "supplier_id": "uuid",
  "file_name": "urunler-2026-01-07.xlsx",
  "file_size": 15360,
  "total_rows": 100,
  "successful_rows": 95,
  "failed_rows": 5,
  "errors": [
    {"row": 10, "field": "name", "error": "Ürün adı boş", "value": ""},
    {"row": 25, "field": "basePrice", "error": "Fiyat 0'dan küçük", "value": -5}
  ],
  "status": "completed",
  "created_at": "2026-01-07T10:00:00Z",
  "completed_at": "2026-01-07T10:02:30Z"
}
```

### Rollback Mekanizması

İçe aktarma sırasında hata oluşursa:
1. Oluşturulan tüm ürünler silinir
2. Import kaydı `rolled_back` olarak işaretlenir
3. Admin hatayı detaylarıyla birlikte görür

---

## Önemli Notlar

1. **Şifre Görme:** Sadece direkt kayıt yapılanlar için mevcuttur
2. **Liste Yükleme:** Otomatik yüklenir, manuel yenileme de mevcuttur
3. **Sepet Persistence:** localStorage ile korunur, visibility sync ile güncellenir
4. **UI İyileştirmeleri:** Tablo formatı, badge'ler, toggle switch'ler ile kullanıcı deneyimi iyileştirildi
5. **Import Audit:** Tüm içe/dışa aktarma işlemleri loglanır ve rollback desteklenir (Faz 10)




