# Phase 2A.4: Bölge Bazlı Teslimat Slotları

## Özet
Teslimat slotlarının veritabanından bölge bazlı çekilmesi, bugünkü geçmiş slotların devre dışı bırakılması ve start saatine göre sıralama.

## Tamamlanma Tarihi
2024-12

## Değişiklikler

### 1. DeliverySlot Tipi Genişletme (`src/types/index.ts`)
```typescript
interface DeliverySlot {
  id: string;
  date: string;
  timeSlot?: "morning" | "afternoon" | "evening"; // legacy
  label: string;
  available: boolean;
  start?: string;  // "08:00" formatı
  end?: string;    // "12:00" formatı
}

interface ProcessedDeliverySlot extends DeliverySlot {
  isPast: boolean;
}
```

### 2. regions Tablosu
- `delivery_slots` JSONB kolonu her bölge için ayrı slot tanımı içerir
- Örnek: `[{"id": "morning", "label": "08:00-12:00", "start": "08:00", "end": "12:00", "available": true}]`

### 3. Checkout Sayfası Güncellemesi (`src/pages/Checkout.tsx`)
- Slotlar DB'den çekiliyor (selectedRegion.delivery_slots)
- Bugünkü slotlar için `isPast` hesaplanıyor (start saati geçmişse)
- Geçmiş slotlar disable + görsel olarak soluk
- Start saatine göre sıralama

### 4. Statik Dosya Cleanup
- `src/data/regions.ts` silindi (artık DB'den geliyor)

## Acceptance Criteria
- [x] Teslimat slotları DB'den yükleniyor
- [x] Bugünkü geçmiş slotlar seçilemez
- [x] Slotlar start saatine göre sıralanır
- [x] Farklı bölgelerde farklı slotlar gösterilebilir
- [x] Legacy `timeSlot` alanı için geriye uyumluluk

## Test Senaryoları
1. Sabah 09:00'da test → 08:00-12:00 slotu disable
2. Öğleden sonra test → sabah slotu disable, öğleden sonra aktif
3. Yarın için slot seçimi → tüm slotlar aktif
4. Bölge değiştir → yeni bölgenin slotları yüklenir
