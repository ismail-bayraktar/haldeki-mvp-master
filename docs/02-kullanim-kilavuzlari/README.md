# 02. Kullanım Kılavuzları

> Rol bazlı kullanım rehberleri

---

## Bu Klasör

Her rol (müşteri, tedarikçi, bayi, admin) için detaylı kullanım kılavuzları.

---

## İçindekiler

| Dosya | Hedef Kitle | Konular |
|-------|------------|---------|
| [musteri-paneli.md](./musteri-paneli.md) | Son kullanıcı | Ürün arama, sepet, sipariş takibi |
| [tedarikci-paneli.md](./tedarikci-paneli.md) | Tedarikçiler | Ürün ekleme, stok yönetimi, siparişleri görme |
| [bayi-paneli.md](./bayi-paneli.md) | Bayiler | B2B siparişler, müşteri yönetimi |
| [admin-paneli.md](./admin-paneli.md) | Admin'ler | Kullanıcı onayı, sistem yönetimi, raporlar |

---

## Rol Bazlı Erişim

```
┌─────────────────────────────────────────────────────────┐
│                      CUSTOMER                           │
│  - Ürün listesini gör                                   │
│  - Sepete ekle                                          │
│  - Sipariş oluştur                                      │
│  - Teslimat takibi                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      SUPPLIER                           │
│  - Ürün katalog yönetimi                                │
│  - Stok takibi                                         │
│  - Gelen siparişleri gör                               │
│  - Fiyat güncelleme                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                       DEALER                            │
│  - B2B sipariş yönetimi                                 │
│  - Müşteri portföyü                                    │
│  - Teslimat planlama                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                        ADMIN                            │
│  - Tüm kullanıcıları gör                                │
│  - Tedarikçi onayı                                      │
│  - Sistem konfigürasyonu                                │
│  - Raporlar ve analytics                                │
└─────────────────────────────────────────────────────────┘
```

---

## İlgili Dokümanlar

- [RBAC ve Güvenlik](../03-mimari/guvenlik-modeli.md)
- [İş Mantığı - Tedarikçi Yaşam Döngüsü](../04-is-mantigi/tedarikci-yasam-dongusu.md)

---

**Son güncelleme:** 2026-01-10
