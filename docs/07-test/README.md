# E2E Test Dokümantasyonu

Haldeki Market projesi için kapsamlı E2E test dokümantasyonu.

## Dokümantasyon İçeriği

Bu klasörde E2E testleri ile ilgili aşağıdaki dokümanlar bulunmaktadır:

### 1. [Yeni Başlayanlar Rehberi](./e2e-getting-started-guide.md) 📘
**E2E testlerini hiç kullanmadıysanız buradan başlayın.**

Bu rehber şunları içerir:
- E2E test nedir ve neden ihtiyacımız var?
- İlk kurulum adımları
- Testleri çalıştırma yöntemleri
- Test sonuçlarını okuma
- Sık karşılaşılan sorunlar ve çözümleri

**Kimler için?** Playwright ile ilk kez çalışan geliştiriciler

### 2. [Hızlı Referans Kartı](./e2e-quick-reference.md) 🚀
**En sık kullanılan komutların kısa özeti.**

Bu doküman şunları içerir:
- Temel test komutları
- Belirli testleri çalıştırma
- Tarayıcı seçenekleri
- Faydalı bayraklar
- Sorun giderme komutları
- Tek sayfalık cheat sheet

**Kimler için?** Sık sık E2E testi çalışan geliştiriciler

### 3. [Görsel Sorun Giderme Rehberi](./e2e-troubleshooting-visual.md) 🔧
**Görsel diyagramlar ile adım adım sorun çözme.**

Bu rehber şunları içerir:
- Akış diyagramları
- Karar ağaçları
- Görsel hata analizi
- HTML raporu kullanımı
- Debug modu kullanımı
- Kontrol listeleri

**Kimler için?** Hata ayıklama yapan geliştiriciler

### 4. [Test Data Attributes Referansı](./test-data-attributes.md) 🏷️
**Test ID'leri ve kullanım alanları.**

Bu doküman şunları içerir:
- Tüm data-testid öznitelikleri
- Bileşen başına test ID'leri
- Implementasyon örnekleri
- Öncelik sıralaması

**Kimler için?** Test bileşenleri geliştirenler

### 5. [E2E Implementasyon Özeti](./e2e-implementation-summary.md) 📋
**Projenin E2E test yapısı ve implementasyon detayları.**

Bu doküman şunları içerir:
- Test yapısı
- Page Object Model
- Test helper'ları
- Auth helper
- Best practices

**Kimler için?** Test altyapısını geliştirenler

---

## Hızlı Başlangıç

### İlk Kurulum

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Playwright tarayıcılarını indirin
npm run test:setup
# veya
npx playwright install

# 3. Test kullanıcılarını oluşturun
npm run test-users:create
```

### Testleri Çalıştırma

```bash
# Tüm E2E testleri
npm run test:e2e

# UI modunda (önerilen)
npm run test:e2e:ui

# Debug modunda
npm run test:e2e:debug

# Sadece bir test dosyası
npx playwright tests/e2e/auth/login.spec.ts
```

---

## Dokümantasyon Kullanım Kılavuzu

### Yeni Geliştirici Misiniz?

1. **Adım:** [Yeni Başlayanlar Rehberi](./e2e-getting-started-guide.md)'ni okuyun
2. **Adım:** İlk kurulum adımlarını uygulayın
3. **Adım:** Basit bir test dosyasını inceleyin
4. **Adım:** `npm run test:e2e:ui` ile testleri çalıştırın

### Test Çalıştırmak İstiyor Musunuz?

1. **Adım:** [Hızlı Referans Kartı](./e2e-quick-reference.md)'na bakın
2. **Adım:** İhtiyacınız olan komutu bulun
3. **Adım:** Komutu çalıştırın

### Hata Aldınız Mı?

1. **Adım:** [Görsel Sorun Giderme Rehberi](./e2e-troubleshooting-visual.md)'ne bakın
2. **Adım:** Hata türünü bulun
3. **Adım:** Adım adım çözümü uygulayın

### Test Yazmak İstiyor Musunuz?

1. **Adım:** [Test Data Attributes Referansı](./test-data-attributes.md)'na bakın
2. **Adım:** Uygun test ID'lerini seçin
3. **Adım:** [E2E Implementasyon Özeti](./e2e-implementation-summary.md)'ndeki pattern'leri kullanın

---

## Sıkça Kullanılan Komutlar

| Amaç | Komut |
|------|-------|
| Tüm testleri çalıştır | `npm run test:e2e` |
| UI modunda çalıştır | `npm run test:e2e:ui` |
| Debug modunda çalıştır | `npm run test:e2e:debug` |
| İlk kurulum | `npm run test:setup` |
| Test kullanıcıları oluştur | `npm run test-users:create` |
| Raporu görüntüle | `npx playwright show-report` |
| Belirli testi çalıştır | `npx playwright test auth/login.spec.ts` |
| İsme göre filtrele | `npx playwright test -g "Login"` |

---

## Proje Yapısı

```
tests/e2e/
├── auth/
│   ├── login.spec.ts          # Giriş testleri
│   └── registration.spec.ts    # Kayıt testleri
├── checkout/
│   └── checkout-flow.spec.ts  # Ödeme akışı testleri
├── admin/
│   └── admin-approval.spec.ts # Admin onay testleri
├── helpers/
│   ├── pages.ts               # Page Object Model
│   ├── auth.ts                # Authentication helper
│   └── test-data.ts           # Test verileri
├── setup.ts                   # Global kurulum
├── teardown.ts                # Global temizleme
└── fixtures.ts                # Test fixtures

playwright.config.ts           # Playwright yapılandırması
```

---

## Testleri Yerel Makinede Çalıştırma

### Adım Adım Kılavuz

1. **Terminali açın ve proje dizinine gidin**
   ```bash
   cd F:\donusum\haldeki-love\haldeki-market
   ```

2. **Supabase'i başlatın** (eğer yerel çalışıyorsanız)
   ```bash
   supabase start
   ```

3. **.env dosyasının olduğundan emin olun**
   ```bash
   # .env dosyası Supabase bilgilerini içermeli
   ```

4. **Test kullanıcılarını oluşturun** (ilk kez)
   ```bash
   npm run test-users:create
   ```

5. **Testleri çalıştırın**
   ```bash
   npm run test:e2e:ui
   ```

---

## Test Sonuçları

Test sonuçları `test-results/` klasöründe saklanır:

```
test-results/
├── index.html                 # HTML raporu
├── junit.xml                  # JUnit raporu
└── <timestamp>-test-results/
    ├── auth/
    │   └── login.spec.ts/
    │       ├── video.webm     # Video kaydı
    │       └── screenshot.png # Screenshot
    └── trace.zip              # Trace dosyası
```

Raporu görüntülemek için:
```bash
npx playwright show-report
```

---

## Destek ve Kaynaklar

### Resmi Dokümantasyon
- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Proje Dokümantasyonu
- Ana dokümantasyon için: [../../README.md](../../README.md)
- Proje durumu için: [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md)

### Sorun Bildirme
Eğer dokümantasyon ile ilgili sorununüz varsa:
1. Önce ilgili dokümanı kontrol edin
2. Sonra sorun giderme rehberine bakın
3. Hala sorununüz varsa ekip ile iletişime geçin

---

## Katkıda Bulunma

Dokümantasyonu geliştirmek için:

1. Dokümantasyon dosyasını düzenleyin
2. Değişikliklerinizi açıklayın
3. Pull request gönderin

Dokümantasyon geliştirmeleri her zaman beklenir!

---

## Özet

| Doküman | Amaç | Hedef Kitle |
|---------|------|-------------|
| [Getting Started Guide](./e2e-getting-started-guide.md) | E2E test öğrenme | Yeni başlayanlar |
| [Quick Reference](./e2e-quick-reference.md) | Hızlı komut erişimi | Tüm geliştiriciler |
| [Troubleshooting Visual](./e2e-troubleshooting-visual.md) | Hata çözme | Test yazanlar |
| [Test Data Attributes](./test-data-attributes.md) | Test ID referansı | Bileşen geliştiriciler |
| [Implementation Summary](./e2e-implementation-summary.md) | Mimari ve yapı | Test altyapı geliştiriciler |

---

**Son Güncelleme:** 2025-01-04
**Sürüm:** 1.0
**Dokümantasyon Sahibi:** Haldeki Market Ekibi
