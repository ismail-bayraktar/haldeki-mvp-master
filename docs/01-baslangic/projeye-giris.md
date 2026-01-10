# Projeye Giriş

> Haldeki.com - 5 dakikalık genel bakış

---

**İçindekiler**
- [Haldeki Nedir?](#haldeki-nedir)
- [Çözdüğü Problem](#çözdüğü-problem)
- [Hedef Kitle](#hedef-kitle)
- [Temel Özellikler](#temel-özellikler)
- [Teknoloji](#teknoloji)

---

## Haldeki Nedir?

**Haldeki**, bölgesel market place platformudur. Müşteriler bölgesindeki tedarikçilerden ürünleri görüntüleyebilir, kıyaslayabilir ve sipariş verebilir.

### Farkındalık

| Tradisyonel Market | Haldeki |
|-------------------|---------|
| Sabit fiyatlar | Bölgesel fiyatlandırma |
| Tek tedarikçi | Çoklu tedarikçi |
| Sınırlı ürün | Geniş katalog |
| Telefon ile sipariş | Online sipariş + takip |

---

## Çözdüğü Problem

### Tedarikçi Sorunu

```
Problem: Kendi ürünlerimi nasıl online satacağım?
- Web sitesi yapımı zor
- Kargo lojistiği karmaşık
- Ödeme altyapısı pahalı

Haldeki Çözümü:
- Platforma katıl → Ürün ekle → Sipariş al
```

### Müşteri Sorunu

```
Problem: En uygun fiyatlı ürünleri nereden bulacağım?
- Her marketi tek tek kontrol et
- Fiyat karşılaştırması zor
- Teslimat takibi yok

Haldeki Çözümü:
- Bölgedeki tüm tedarikçiler
- Fiyat karşılaştırması
- Teslimat slot rezervasyonu
```

---

## Hedef Kitle

### Müşteriler
- Ev hanımları
- Restoran sahipleri
- Küçük işletmeler

### Tedarikçiler
- Manavlar
- Kasaplar
- Üreticiler
- Toptancılar

### Bayiler
- Bölgesel dağıtımcılar
- Lojistik firmaları

---

## Temel Özellikler

### 1. Bölgesel Fiyatlandırma

```
A bölgesinde: Domates 15 TL/kg
B bölgesinde: Domates 18 TL/kg
C bölgesinde: Domates 12 TL/kg

Kullanıcı kendi bölgesinin fiyatlarını görür.
```

### 2. Çoklu Tedarikçi

```
Domates araması:
- Tedarikçi A: 15 TL/kg
- Tedarikçi B: 18 TL/kg
- Tedarikçi C: 12 TL/kg

Kullanıcı en uygun fiyatı seçer.
```

### 3. Teslimat Slotları

```
- 09:00 - 11:00
- 11:00 - 13:00
- 13:00 - 15:00
- 15:00 - 17:00
- 17:00 - 19:00

Kullanıcı uygun slotu seçer.
```

---

## Roller

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER (Müşteri)                   │
│  - Ürün listesini gör                                    │
│  - Fiyat karşılaştır                                     │
│  - Sepete ekle                                          │
│  - Sipariş oluştur                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   SUPPLIER (Tedarikçi)                   │
│  - Ürün katalogu yönetimi                                │
│  - Fiyat ve stok güncelleme                              │
│  - Gelen siparişleri gör                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                     DEALER (Bayi)                        │
│  - B2B sipariş yönetimi                                  │
│  - Müşteri portföyü                                     │
│  - Teslimat planlama                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      ADMIN (Yönetici)                    │
│  - Tüm kullanıcıları gör                                 │
│  - Tedarikçi onayı                                       │
│  - Sistem konfigürasyonu                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Teknoloji

### Frontend
- **React 18** - UI framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **shadcn/ui** - Komponentler

### Backend
- **Supabase** - Postgres + Auth + Storage
- **RLS** - Row Level Security
- **Edge Functions** - Sunucu logic

### Altyapı
- **Vercel** - Hosting
- **Brevo** - Email servisi

---

## Proje Durumu

| Faz | Durum |
|-----|-------|
| 1-11 | ✅ Tamamlandı |
| 12 - Çoklu Tedarikçi | ✅ Tamamlandı |

---

## Sonraki Adımlar

1. [Kurulum Rehberi](./kurulum.md) - Ortam kurulumu
2. [Test Hesaplar](./test-hesaplar.md) - Rol bazlı test
3. [Mimari Genel Bakış](../03-mimari/genel-bakis.md) - Sistem yapısı

---

**Son güncelleme:** 2026-01-10
**Okuma süresi:** 5 dakika
