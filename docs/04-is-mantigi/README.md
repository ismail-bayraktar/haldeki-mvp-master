# 04. İş Mantığı

> İş akışları ve domain mantığı

---

## Bu Klasör

Business logic ve domain akışlarının dökümante edildiği kısım.

---

## İçindekiler

| Dosya | İş Akışı | Katılımcılar |
|-------|----------|--------------|
| [tedarikci-yasam-dongusu.md](./tedarikci-yasam-dongusu.md) | Kayıt → Onay → Ürün ekleme | Tedarikçi, Admin |
| [siparis-akisi.md](./siparis-akisi.md) | Sepet → Sipariş → Teslimat | Müşteri, Tedarikçi, Bayi |
| [bolgesel-fiyatlandirma.md](./bolgesel-fiyatlandirma.md) | Bölge bazlı fiyat hesaplama | Admin, Tedarikçi |
| [onay-sistemi.md](./onay-sistemi.md) | Tedarikçi onay workflow'u | Admin |

---

## İş Akışları Map

```
┌──────────────────────────────────────────────────────────────┐
│                    TEDARİKÇİ YAŞAM DÖNGÜSÜ                    │
│                                                              │
│  1. Kayıt Ol   →   2. Email Onay   →   3. Admin Onay        │
│  (Form)            (Brevo)              (Panel)               │
│                                                              │
│  4. Ürün Ekle →   5. Stok Giriş   →   6. Sipariş Al         │
│  (Katalog)        (Inventory)          (Otomatik)            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      SİPARİŞ YAŞAM DÖNGÜSÜ                   │
│                                                              │
│  1. Ürün Seç  →  2. Sepete Ekle  →  3. Adres/Slot           │
│  (Liste)         (Cart)              (Checkout)              │
│                                                              │
│  4. Sipariş   →   5. Onay   →   6. Hazırla   →   7. Teslim  │
│  (Create)        (Payment)          (Picker)       (Driver)   │
└──────────────────────────────────────────────────────────────┘
```

---

## İlgili Dokümanlar

- [Kullanım Kılavuzları](../02-kullanim-kilavuzlari/)
- [Mimari - Veri Akışları](../03-mimari/veri-akislari.md)
- [Faz 6: Sipariş & Teslimat](../05-fazlar/phase-6-siparis-teslimat.md)

---

**Son güncelleme:** 2026-01-10
