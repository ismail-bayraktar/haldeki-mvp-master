# Haldeki.com Dokümantasyon Merkezi

> **Bölgesel Market Place Platformu** - Çoklu tedarikçi, bölgesel fiyatlandırma ve akıllı teslimat sistemi

---

## Hızlı Erişim Map

```
                    HALDEKI DOKÜMANTASYON
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    BAŞLANGIÇ            KULLANIM            MİMARİ
    │                    │                    │
    ├─ Kurulum           ├─ Tedarikçi         ├─ Veritabanı
    ├─ Test Hesaplar     ├─ Admin             ├─ API
    └─ İlk Adımlar       ├─ Bayi              └─ Güvenlik
                         └─ Müşteri
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                FAZLAR           GELİŞTİRME
                │                 │
                ├─ Phase 1-12     ├─ Kod Standartları
                └─ Roadmap        ├─ Testing
                                   └─ Deployment
```

---

## Dokümantasyon İçeriği

### 1. Başlangıç [`01-baslangic/`](./01-baslangic/)
Yeni gelenler için hızlı başlangıç rehberi.
- [Projeye Giriş](./01-baslangic/projeye-giris.md) - Haldeki nedir?
- [Kurulum Rehberi](./01-baslangic/kurulum.md) - Local kurulum adımları
- [Test Hesaplar](./01-baslangic/test-hesaplar.md) - Test kullanıcılari

### 2. Kullanım Kılavuzları [`02-kullanim-kilavuzlari/`](./02-kullanim-kilavuzlari/)
Rol bazlı kullanım rehberleri.
- [Tedarikçi Paneli](./02-kullanim-kilavuzlari/tedarikci-paneli.md) - Ürün yönetimi
- [Admin Panel](./02-kullanim-kilavuzlari/admin-paneli.md) - Sistem yönetimi
- [Bayi Panel](./02-kullanim-kilavuzlari/bayi-paneli.md) - Sipariş yönetimi

### 3. Mimari [`03-mimari/`](./03-mimari/)
Teknik mimari ve tasarım kararları.
- [Veritabanı Şeması](./03-mimari/veritabani-semasi.md) - Tablo yapısı
- [API Referansı](./03-mimari/api-referans.md) - Endpoint'ler
- [Güvenlik Modeli](./03-mimari/guvenlik-modeli.md) - RLS ve RBAC

### 4. İş Mantığı [`04-is-mantigi/`](./04-is-mantigi/)
İş akışları ve domain mantığı.
- [Tedarikçi Yaşam Döngüsü](./04-is-mantigi/tedarikci-yasam-dongusu.md)
- [Sipariş Akışı](./04-is-mantigi/siparis-akisi.md)
- [Bölgesel Fiyatlandırma](./04-is-mantigi/bolgesel-fiyatlandirma.md)

### 5. Fazlar [`05-fazlar/`](./05-fazlar/)
Geliştirme fazlarının detaylı dökümanı.
- [Phase 1-12 Özeti](./05-fazlar/faz-ozeti.md)
- [Phase 2A: Bölge Sistemi](./05-fazlar/phase-2a-bolge-sistemi.md)
- [Phase 12: Çoklu Tedarikçi](./05-fazlar/phase-12-coklu-tedarikci.md)

### 6. Geliştirme [`06-gelistirme/`](./06-gelistirme/)
Geliştirici rehberleri ve standartlar.
- [Kod Standartları](./06-gelistirme/kod-standartlari.md)
- [Git Workflow](./06-gelistirme/git-workflow.md)
- [Debugging Rehberi](./06-gelistirme/debugging.md)

### 7. Test [`07-test/`](./07-test/)
Test stratejileri ve raporları.
- [Test Stratejisi](./07-test/test-stratejisi.md)
- [E2E Test Senaryoları](./07-test/e2e-test-senaryolari.md)
- [Test Raporları](./07-test/test-raporlari.md)

### 8. Deployment [`08-deployment/`](./08-deployment/)
Deployment ve operasyon rehberleri.
- [Production Deployment](./08-deployment/production-deployment.md)
- [Environment Konfigürasyonu](./08-deployment/environment-konfigurasyonu.md)
- [Rollback Prosedürü](./08-deployment/rollback-proseduru.md)

### 9. Raporlar [`09-raporlar/`](./09-raporlar/)
Günlük ve dönemsel raporlar.
- [2026-01 Raporları](./09-raporlar/2026-01/)
- [Audit Raporları](./09-raporlar/audit-raporlari.md)

### 10. Bakım [`10-bakim/`](./10-bakim/)
Bakım ve monitoring rehberleri.
- [Monitoring](./10-bakim/monitoring.md)
- [Backup & Recovery](./10-bakim/backup-recovery.md)
- [Troubleshooting](./10-bakim/troubleshooting.md)

### 11. Teknik [`11-teknik/`](./11-teknik/)
Detaylı teknik dokümanlar.
- [Performance Optimization](./11-teknik/performance-optimization.md)
- [Migration Scripts](./11-teknik/migration-scripts.md)

### 12. Referanslar [`12-referanslar/`](./12-referanslar/)
Dış referanslar ve kaynaklar.
- [Supabase Dokümantasyonu](./12-referanslar/supabase.md)
- [React Best Practices](./12-referanslar/react-best-practices.md)

---

## Hızlı Başlangıç

### Yeni Geliştirici İçin

1. **Projeyi Anla**
   - [Proje Giriş](./01-baslangic/projeye-giris.md) - 5 dakikalık okuma
   - [Mimari Genel Bakış](./03-mimari/genel-bakis.md) - Sistem yapısı

2. **Kurulum Yap**
   ```bash
   git clone <repo-url>
   cd haldeki-market
   npm install
   cp .env.example .env
   # .env dosyasını düzenle
   npm run dev
   ```

3. **Test Hesaplarla İncele**
   - [Test Hesaplar](./01-baslangic/test-hesaplar.md) - Rol bazlı giriş

### Yeni Özellik Geliştirecek İçin

1. **Faz Planını Kontrol Et**
   - [ROADMAP.md](./ROADMAP.md) - Mevcut durum
   - [Faz Detayları](./05-fazlar/) - Implementasyon rehberi

2. **Kod Standartlarını Uygula**
   - [Kod Standartları](./06-gelistirme/kod-standartlari.md)
   - [Testing Rehberi](./07-test/test-stratejisi.md)

---

## Proje Durumu

| Faz | Durum | Açıklama |
|-----|-------|----------|
| 1 - Temel Altyapı | ✅ Tamamlandı | Supabase kurulumu, auth sistemi |
| 2A - Bölge Sistemi | ✅ Tamamlandı | RegionContext, ürün-bölge entegrasyonu |
| 2B - Admin Bölge Yönetimi | ✅ Tamamlandı | Bölge CRUD, teslimat slotları |
| 3 - RBAC & Rol Sistemi | ✅ Tamamlandı | 5 rol: customer, supplier, dealer, business, admin |
| 4 - Email Sistemi | ✅ Tamamlandı | Brevo entegrasyonu |
| 5 - Onay Sistemi | ✅ Tamamlandı | Tedarikçi onay workflow'u |
| 6 - Sipariş & Teslimat | ✅ Tamamlandı | Sepet → Sipariş → Teslimat |
| 7 - Ödeme Sistemi | ✅ Tamamlandı | Ödeme altyapısı |
| 8 - İşletme (B2B) Paneli | ✅ Tamamlandı | Bayi yönetim paneli |
| 9 - Tedarikçi Mobil Panel | ✅ Tamamlandı | Mobil uyumlu tedarikçi paneli |
| 10 - Excel/CSV Import/Export | ✅ Tamamlandı | Toplu veri işlemi |
| 11 - Depo Yönetim MVP | ✅ Tamamlandı | Depo fiyat maskeleme |
| 12 - Çoklu Tedarikçi Sistemi | ✅ Tamamlandı | Global product catalog |

---

## Teknoloji Stack

### Frontend
| Teknoloji | Versiyon | Kullanım Alanı |
|-----------|----------|----------------|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Tip güvenliği |
| Vite | 6.0 | Build tool |
| Tailwind CSS | 4.0 | Styling |
| shadcn/ui | - | UI komponentleri |
| TanStack Query | - | Veri yönetimi |
| React Router | - | Routing |

### Backend
| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| Supabase | Postgres + Auth + Storage |
| Row Level Security (RLS) | Veri güvenliği |
| Edge Functions | Sunucu tarafı logic |
| Brevo | Email servisi |

---

## Önemli Linkler

| Kaynak | Link |
|--------|------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Brevo Dashboard | https://app.brevo.com |
| Production | https://haldeki.com |
| Staging | https://staging.haldeki.com |

---

## Dokümantasyon Standartları

### Format Kuralları
- Tüm dokümanlar **Türkçe** yazılır
- Markdown formatı kullanılır
- Kod blokları syntax-highlight edilir
- Mermaid diyagramları tercih edilir

### Dosya İsimlendirme
- Kebab-case: `siparis-akisi.md`
- Faz dokümanları: `phase-X-isim.md`
- Rehberler: `01-baslik.md` (numaralı)

### Versiyonlama
Her sayfanın sonunda:
```markdown
---
Son güncelleme: 2026-01-10
Sürüm: 1.0
```

---

## Arama İpuçları

**Aradığınızı hızlıca bulun:**

| Konu | Git → |
|------|--------|
| "Nasıl tedarikçi eklerim?" | [Tedarikçi Paneli](./02-kullanim-kilavuzlari/tedarikci-paneli.md) |
| "Database yapısı?" | [Veritabanı Şeması](./03-mimari/veritabani-semasi.md) |
| "Test hesaplar?" | [Test Hesaplar](./01-baslangic/test-hesaplar.md) |
| "Deployment nasıl yapılır?" | [Production Deployment](./08-deployment/production-deployment.md) |
| "Hata ayıklama?" | [Troubleshooting](./10-bakim/troubleshooting.md) |

---

## Katkıda Bulunma

1. Yeni özellik önce [ROADMAP.md](./ROADMAP.md)'e eklenir
2. Implementasyon [05-fazlar/](./05-fazlar/) altında dökümante edilir
3. Mimari değişiklikler [03-mimari/](./03-mimari/) altına eklenir
4. Her değişiklik sonrası ilgili README'ler güncellenir

---

## İletişim

| Konu | Kişi |
|------|------|
| Teknik sorular | Tech Lead |
| Business sorular | Product Manager |
| Deployment | DevOps |

---

**Son güncelleme:** 2026-01-10
**Dokümantasyon sürümü:** 2.0
**Platform sürümü:** v1.12.0 (Phase 12 Complete)
