# Dokümantasyon Migrasyon Planı

> Tüm eski klasörlerin yeni 12 kategorilik wiki yapısına taşınma planı

---

## 1. Mevcut Envanter

### 1.1. Eski Klasörler ve Dosya Sayıları

| Eski Klasör | Dosya Sayısı | Durum |
|-------------|--------------|-------|
| phases/ | 14 | Faz 1-12 dokümanları |
| reports/ | 40+ | Audit, test, deploy raporları |
| business/ | 6 | İş akış diyagramları |
| testing/ | 5 | E2E test rehberleri |
| development/ | 3 | Geliştirme dokümanları |
| guides/ | 4 | Supabase rehberleri |
| api/ | 2 | API dokümantasyonu |
| architecture/ | 1 | Database schema |
| diagrams/ | 2 | İş akış diyagramları |
| checklists/ | 3 | Kontrol listeleri |
| fixes/ | 2 | Fix raporları |
| notes/ | 1 | Notlar |
| reviews/ | 2 | Code review raporları |
| security/ | 2 | Güvenlik raporları |
| technical-debt/ | 2 | Teknik borç raporları |
| img-ref/ | 3 | Referans görseller (png) |
| speed-test-sonuc/ | 2 | Performans test sonuçları (pdf) |

**Toplam:** ~80+ dosya, ~30,000+ satır doküman

---

## 2. Kategori Eşleşme Tablosu

### 2.1. Faz Dokümanları → 05-fazlar/

| Eski Dosya | Yeni Konum | Aksiyon |
|------------|------------|---------|
| phases/phase-10-import-export.md | 05-fazlar/phase-10-excel.md | Yeniden adlandır |
| phases/phase-11-warehouse-mvp.md | 05-fazlar/phase-11-depo.md | Yeniden adlandır |
| phases/phase-12-multi-supplier.md | 05-fazlar/phase-12-coklu-tedarikci.md | Yeniden adlandır |
| phases/phase-2a*.md (4 dosya) | 05-fazlar/phase-2a-bolge-sistemi.md | BİRLEŞTİR |
| phases/phase-3-rbac.md | 05-fazlar/phase-3-rbac.md | Taşı |
| phases/phase-4-email.md | 05-fazlar/phase-4-email.md | Taşı |
| phases/phase-5-approval-system.md | 05-fazlar/phase-5-onay-sistemi.md | Yeniden adlandır |
| phases/phase-6-order-delivery.md | 05-fazlar/phase-6-siparis-teslimat.md | Yeniden adlandır |
| phases/phase-7-payment-system.md | 05-fazlar/phase-7-odeme.md | Yeniden adlandır |
| phases/phase-8-business-panel.md | 05-fazlar/phase-8-b2b-panel.md | Yeniden adlandır |
| phases/phase-9-supplier-panel.md | 05-fazlar/phase-9-mobil-tedarikci.md | Yeniden adlandır |

### 2.2. Raporlar → 09-raporlar/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| reports/ (tümü) | 09-raporlar/2026-01/ | Tümünü taşı |
| security/ | 09-raporlar/guvenlik/ | Klasör oluştur, taşı |
| fixes/ | 09-raporlar/fixler/ | Klasör oluştur, taşı |
| reviews/ | 09-raporlar/code-reviews/ | Klasör oluştur, taşı |
| speed-test-sonuc/ | 09-raporlar/2026-01/performans/ | Klasör oluştur, taşı |

### 2.3. İş Mantığı → 04-is-mantigi/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| business/ (tümü) | 04-is-mantigi/ | Tümünü taşı |
| diagrams/ (tümü) | 04-is-mantigi/diyagramlar/ | Klasör oluştur, taşı |

### 2.4. Test → 07-test/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| testing/ (tümü) | 07-test/ | Tümünü taşı |
| BETA-TESTING-GUIDE.md | 07-test/beta-testing-rehberi.md | Yeniden adlandır |

### 2.5. Geliştirme → 06-gelistirme/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| development/ (tümü) | 06-gelistirme/ | Tümünü taşı |
| technical-debt/ | 10-bakim/teknik-borc/ | Klasör oluştur, taşı |
| notes/ | 06-gelistirme/notlar/ | Klasör oluştur, taşı |
| checklists/ | 06-gelistirme/kontroller/ | Klasör oluştur, taşı |

### 2.6. Mimari → 03-mimari/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| api/ (tümü) | 03-mimari/api/ | Klasör oluştur, taşı |
| architecture/ (tümü) | 03-mimari/veritabani-semasi.md | Yeniden adlandır, taşı |

### 2.7. Kullanım Kılavuzları → 02-kullanim-kilavuzlari/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| guides/ (tümü) | 12-referanslar/supabase/ | Klasör oluştur, taşı |
| SUPERADMIN-*.md | 02-kullanim-kilavuzlari/ | Taşı |
| PASSWORD_RESET_GUIDE.md | 02-kullanim-kilavuzlari/ | Taşı |
| TEDARIKCI_KULLANIM_KILAVUZU.md | 02-kullanim-kilavuzlari/tedarikci-paneli.md | Birleştir |
| UPDATE-TEST-ACCOUNTS.md | 01-baslangic/test-hesaplar.md | Birleştir |

### 2.8. Deployment → 08-deployment/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| MIGRATION_*.md (4 dosya) | 08-deployment/migrasyon-*.md | Taşı |

### 2.9. Teknik → 11-teknik/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| TARGET_KEYWORDS.md | 11-teknik/seo-keywords.md | Taşı ve adlandır |

### 2.10. Referanslar → 12-referanslar/

| Eski Klasör/Dosya | Yeni Konum | Aksiyon |
|------------------|------------|---------|
| img-ref/ (tümü) | 12-referanslar/gorsel-referanslar/ | Klasör oluştur, taşı |

---

## 3. Birleştirme Stratejisi

### 3.1. Phase 2A Dosyalarını Birleştirme

Hedef Dosya: 05-fazlar/phase-2a-bolge-sistemi.md

Kaynak Dosyalar:
- phases/phase-2a1-regioncontext.md
- phases/phase-2a2-region-products.md
- phases/phase-2a3-cart-region.md
- phases/phase-2a4-delivery-slots.md

Yapı:
- Bölüm 1: RegionContext
- Bölüm 2: Bölgesel Ürünler
- Bölüm 3: Sepet Entegrasyonu
- Bölüm 4: Teslimat Slotları

### 3.2. Tedarikçi Kullanım Kılavuzunu Birleştirme

Mevcut: 02-kullanim-kilavuzlari/tedarikci-paneli.md
Eklenecek: TEDARIKCI_KULLANIM_KILAVUZU.md

Strateji:
1. Her iki dosyayı oku
2. Benzersız bölümleri tespit et
3. Mevcut TEMPLATE formatını koru
4. Eksik bölümleri mevcut dosyaya ekle
5. Gereksiz tekrarları elimine et

### 3.3. Test Hesapları Birleştirme

Mevcut: 01-baslangic/test-hesaplar.md
Eklenecek: UPDATE-TEST-ACCOUNTS.md, development/TEST_ACCOUNTS.md

Strateji:
1. Test hesap tablosunu güncelle
2. Eski hesapları "arşivlenen" bölümüne taşı
3. Yeni hesapları tabloya ekle
4. Her hesabın kullanım senaryosunu açıkla

---

## 4. Öncelik Sırası

### P0 - Kritik
1. Phase 2A birleştirme - 4 dosya -> 1 dosya
2. Raporları organize et - Tüm raporlar doğru klasöre
3. İş mantığını birleştir - business/ + diagrams/ -> 04-is-mantigi/

### P1 - Yüksek
4. Test dokümanlarını birleştir
5. Geliştirme dokümanlarını organize et
6. Faz dosyalarını taşı (Phase 2A hariç)

### P2 - Orta
7. Kullanım kılavuzlarını birleştir
8. Mimarisi düzenle
9. Deployment dosyalarını taşı

### P3 - Düşük
10. Referansları organize et
11. Teknik dosyaları taşı
12. Eski klasörleri temizle

---

**Oluşturma Tarihi:** 2026-01-10
**Sürüm:** 1.0
**Durum:** Hazır
