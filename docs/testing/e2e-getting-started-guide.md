# E2E Test Rehberi - Yeni Başlayanlar İçin

> **End-to-End (E2E) Testing** - Uygulamanızı gerçek bir kullanıcı gibi test etme yöntemi

## İçindekiler

1. [E2E Test Nedir?](#e2e-test-nedir)
2. [İlk Kurulum](#ilk-kurulum)
3. [Testleri Çalıştırma](#testleri-çalıştırma)
4. [Test Sonuçlarını Okuma](#test-sonuçlarını-okuma)
5. [Hızlı Referans Kartı](#hızlı-referans-kartı)
6. [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)

---

## E2E Test Nedir?

### Basitçe Anlatım

**E2E (End-to-End) test**, uygulamanızı bir son kullanıcının gözünden test etmenin bir yoludur.

```
┌─────────────────────────────────────────────────────────────┐
│  E2E Testin Çalışma Prensibi                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Tarayıcı açılır                                         │
│     ↓                                                       │
│  2. Siteye gidilir (http://localhost:8080)                 │
│     ↓                                                       │
│  3. İşlemler yapılır (giriş, sepete ekleme, vb.)           │
│     ↓                                                       │
│  4. Sonuçlar kontrol edilir (doğru sayfada mıyız?)         │
│     ↓                                                       │
│  5. Test sonucu raporlanır                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Neden E2E Test İhtiyacımız Var?

| Test Türü | Neyi Test Eder? | Örnek |
|-----------|-----------------|-------|
| **Unit Test** | Tek bir fonksiyonu | `topla(2, 3) === 5` |
| **Integration Test** | Birkaç bileşenin birlikte çalışması | Sepet + Ürün bileşeni |
| **E2E Test** | Tüm uygulamayı gerçek tarayıcıda | Giriş → Sepete Ekle → Satın Al |

### Playwright Nedir?

**Playwright**, Microsoft tarafından geliştirilen bir E2E test aracıdır:

- Chromium, Firefox, WebKit (Safari) tarayıcılarında test çalıştırır
- Gerçek bir tarayıcı gibi davranır
- Ekran kaydı, screenshot alabilir
- Hatalı olduğunda otomatik olarak video kaydeder

---

## İlk Kurulum

### Adım 1: Tarayıcıları İndirin (İlk Kez)

Playwright, testleri çalıştırmak için tarayıcılara ihtiyaç duyar. İlk kez kurulum yapmanız gerekiyor.

```bash
# PowerShell veya Komut İsteminde çalıştırın:
npx playwright install
```

**Bu komut ne yapar?**
- Chromium (Chrome benzeri) tarayıcısını indirir
- Firefox tarayıcısını indirir
- WebKit (Safari benzeri) tarayıcısını indirir
- Yaklaşık 200-300 MB disk alanı kaplar

**Beklenen çıktı:**
```
Downloading Chromium 123.0.0...
Downloading Firefox 123.0.0...
Downloading WebKit 17.4...
Browsers downloaded to: C:\Users\KullaniciAdi\AppData\Local\ms-playwright
```

### Adım 2: Kurulumu Doğrulayın

```bash
npx playwright --version
```

**Beklenen çıktı:**
```
Version 1.57.0
```

### Adım 3: Geliştirme Sunucusunu Çalıştırın

Playwright testleri çalıştırırken uygulamanın açık olmasına gerek yoktur. Playwright otomatik olarak sunucuyu başlatır.

Ancak manuel olarak başlatmak isterseniz:

```bash
npm run dev
```

Sunucu `http://localhost:8080` adresinde başlayacaktır.

---

## Testleri Çalıştırma

### Tüm Testleri Çalıştır

Tüm E2E testlerini çalıştırmak için:

```bash
npm run test:e2e
```

**Beklenen çıktı:**
```
Running 15 tests using 3 workers

  ✓ [chromium] › auth/login.spec.ts:15:3 › Login - Customer (2.5s)
  ✓ [chromium] › auth/login.spec.ts:32:3 › should show error with invalid credentials (1.8s)
  ✓ [firefox] › auth/login.spec.ts:48:3 › Login - Admin (2.1s)
  ...

  15 passed (12.3s)
```

### Tek Bir Test Dosyasını Çalıştır

Sadece giriş testlerini çalıştırmak için:

```bash
npx playwright test auth/login.spec.ts
```

### Görsel Arayüz ile Çalıştır (Önerilen)

Testlerin nasıl çalıştığını görmek için en iyi yöntem:

```bash
npm run test:e2e:ui
```

Bu komut size güzel bir arayüz açar:

```
┌────────────────────────────────────────────────────────────┐
│  Playwright Test UI                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ Test List ───┐  ┌─ Test Details ──┐                   │
│  │ ✓ auth/login  │  │ Page: /login     │                   │
│  │ ✓ auth/signup │  │ Action: Click... │                   │
│  │ ✓ checkout    │  │                  │                   │
│  └───────────────┘  └──────────────────┘                   │
│                                                            │
│  [Rerun All] [Run Filtered] [Watch Mode]                  │
└────────────────────────────────────────────────────────────┘
```

### Hata Ayıklama Modunda Çalıştır

Test adım adım çalışır, her adımda durur:

```bash
npm run test:e2e:debug
```

Bu modda:
- Test her adımda durur
- DevTools paneli açılır
- Değişkenleri inceleyebilirsiniz
- Element seçebilirsiniz

### Tarayıcı Penceresini Göster

Normalde Playwright arka planda çalışır. Tarayıcıyı görmek için:

```bash
npm run test:e2e:headed
```

### Belirli Bir Tarayıcıda Çalıştır

```bash
# Sadece Chromium
npx playwright test --project=chromium

# Sadece Firefox
npx playwright test --project=firefox

# Sadece WebKit
npx playwright test --project=webkit
```

### Belirli Bir Testi Çalıştır

Dosya içindeki belirli bir testi çalıştırmak için:

```bash
# 5. satırdaki testi çalıştır
npx playwright test --line 5

# "Login" içeren testleri çalıştır
npx playwright test -g "Login"
```

---

## Test Sonuçlarını Okuma

### Başarılı Test Çıktısı

```
Running 8 tests using 3 workers

  ✓ [chromium] › auth/login.spec.ts:18:5 › should allow customer to login (2.1s)
  ✓ [chromium] › auth/login.spec.ts:32:5 › should show error with invalid credentials (1.5s)
  ✓ [chromium] › admin/admin-approval.spec.ts:15:5 › should approve dealer (3.2s)
  ✓ [firefox] › checkout/checkout-flow.spec.ts:20:5 › should complete checkout (5.1s)
  ...

  8 passed (10.5s)
```

**Neler görüyoruz?**
- `✓` - Test başarılı
- `[chromium]` - Hangi tarayıcıda çalıştı
- `auth/login.spec.ts:18:5` - Dosya ve satır numarası
- `should allow customer to login` - Testin adı
- `(2.1s)` - Testin süresi
- `8 passed` - Kaç test başarılı
- `(10.5s)` - Toplam süre

### Başarısız Test Çıktısı

```
Running 8 tests using 3 workers

  ✗ [chromium] › auth/login.spec.ts:18:5 › should allow customer to login (2.1s)
    Error: expect(page).toHaveURL(/\/giris/)

    Expected: "/giris"
    Received: "/"

    at login.spec.ts:28:17

  7 passed | 1 failed
```

**Neler görüyoruz?**
- `✗` - Test başarısız
- `Error:` - Hata mesajı
- `Expected:` - Beklenen değer
- `Received:` - Alınan değer
- `at login.spec.ts:28:17` - Hatanın olduğu satır

### HTML Raporu

Her test çalıştırmadan sonra HTML raporu oluşturulur:

```bash
# Raporu aç
npx playwright show-report
```

Rapor tarayıcınızda açılır:

```
http://localhost:9323
```

Rapor şunları içerir:
- Hangi testler geçti/kaldı
- Her testin süresi
- Hatalı testler için screenshot
- Hatalı testler için video kaydı
- Trace (adım adım neler oldu)

---

## Hızlı Referans Kartı

### Temel Komutlar

| Komut | Açıklama | Kullanım |
|-------|----------|----------|
| `npm run test:e2e` | Tüm testleri çalıştır | Normal test çalıştırma |
| `npm run test:e2e:ui` | UI modunda çalıştır | Testleri görsel olarak izle |
| `npm run test:e2e:debug` | Debug modunda çalıştır | Adım adım hata ayıklama |
| `npm run test:e2e:headed` | Tarayıcıyı göster | Görsel olarak izle |
| `npx playwright test <dosya>` | Belirli dosyayı çalıştır | Tek dosya testi |
| `npx playwright test -g "<kelime>"` | İsme göre filtrele | Belirli testleri çalıştır |
| `npx playwright show-report` | Raporu görüntüle | Sonuçları incele |

### Proje Komutları

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlat |
| `npm run test` | Unit testleri çalıştır |
| `npm run test:e2e` | E2E testleri çalıştır |
| `npm run test:all` | Tüm testleri çalıştır |

### Tarayıcı Seçenekleri

| Bayrak | Açıklama |
|--------|----------|
| `--project=chromium` | Sadece Chromium |
| `--project=firefox` | Sadece Firefox |
| `--project=webkit` | Sadece WebKit |
| `--headed` | Tarayıcıyı göster |
| `--debug` | Debug modunda çalıştır |

### Faydalı Bayraklar

| Bayrak | Açıklama | Örnek |
|--------|----------|-------|
| `--grep` | İsme göre filtrele | `--grep "Login"` |
| `--workers` | Worker sayısı | `--workers=1` |
| `--repeat-each` | Her testi tekrarla | `--repeat-each=3` |
| `--timeout` | Zaman aşımı süresi | `--timeout=10000` |
| `--retries` | Başarısız olunca tekrar dene | `--retries=2` |

---

## Sık Karşılaşılan Sorunlar

### Sorun 1: "Hiçbir şey olmadı"

**Belirti:**
```bash
npm run test:e2e
# Çıktı yok veya boş
```

**Olası Sebepler ve Çözümler:**

#### A. Tarayıcılar Kurulu Değil

```bash
# Çözüm: Tarayıcıları indirin
npx playwright install
```

#### B. Port Çakışması

Port 8080 zaten kullanımda olabilir.

```bash
# Çözüm 1: Başka uygulamayı kapatın
netstat -ano | findstr :8080

# Çözüm 2: Vite portunu değiştirin (vite.config.ts)
# port: 8081 olarak değiştirin ve playwright.config.ts'de de güncelleyin
```

#### C. Dosya Yolu Hatası

```bash
# Çözüm: Doğru dizinde olduğunuzdan emin olun
cd F:\donusum\haldeki-love\haldeki-market
npm run test:e2e
```

#### D. testDir Yanlış Yapılandırılmış

`playwright.config.ts` dosyasını kontrol edin:

```typescript
export default defineConfig({
  testDir: './tests/e2e',  // Bu satır doğru mu?
  // ...
});
```

### Sorun 2: "Browser not installed"

**Belirti:**
```
Error: BrowserType chromium not found
```

**Çözüm:**
```bash
# Tarayıcıları tekrar indirin
npx playwright install

# Veya
npx playwright install --force
```

### Sorun 3: Zaman Aşımı (Timeout)

**Belirti:**
```
Error: Test timeout of 30000ms exceeded
```

**Çözümler:**

#### A. Testin zaman aşımını artırın

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 saniye
  // test kodları...
});
```

#### B. Global zaman aşımını artırın

`playwright.config.ts`:
```typescript
export default defineConfig({
  timeout: 60000, // 60 saniye
  // ...
});
```

### Sorun 4: "Cannot find module"

**Belirti:**
```
Error: Cannot find module './helpers/pages'
```

**Çözüm:**
```bash
# Bağımlılıkları yükleyin
npm install

# Veya
npm ci
```

### Sorun 5: Authentication Başarısız

**Belirti:**
```
Error: Login failed - Invalid credentials
```

**Çözümler:**

#### A. Test kullanıcıları oluşturun

```bash
npm run test-users:create
```

#### B. Supabase bağlantısını kontrol edin

`.env` dosyasının varlığından ve doğru olduğundan emin olun:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### C. Helper dosyalarını kontrol edin

`tests/e2e/helpers/auth.ts` dosyasındaki test kullanıcı bilgilerini doğrulayın.

### Sorun 6: Element Bulunamadı

**Belirti:**
```
Error: locator.click: Target closed
```

**Çözümler:**

#### A. Bekleme süresi ekleyin

```typescript
await page.waitForLoadState('networkidle');
await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
await page.locator('[data-testid="login-email"]').click();
```

#### B. Test ID'leri kontrol edin

Bileşenlerde `data-testid` özniteliklerinin varlığından emin olun:

```tsx
<Button data-testid="login-submit">Giriş Yap</Button>
```

### Sorun 7: Video ve Screenshot Bulunamadı

**Belirti:**
```
Error: Cannot find video/screenshot for failed test
```

**Çözüm:**

`playwright.config.ts` dosyasını kontrol edin:

```typescript
use: {
  video: 'retain-on-failure',  // Sadece hatalı olanları tut
  screenshot: 'only-on-failure',  // Sadece hatalı olanlarda截图
  trace: 'on-first-retry',  // İlk retry'de trace tut
}
```

Test raporu ile aynı dizinde olup olmadığını kontrol edin:

```bash
ls test-results/
# 01-04-2025_10-30-15-test-results/
```

---

## Test Dosyası Örneği

E2E test dosyası nasıl görünür?

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Giriş Testleri', () => {
  test('başarılı giriş', async ({ page }) => {
    // 1. Sayfaya git
    await page.goto('/');

    // 2. Giriş formunu aç
    await page.click('[data-testid="auth-drawer-trigger"]');

    // 3. Email gir
    await page.fill('[data-testid="login-email"]', 'test@test.com');

    // 4. Şifre gir
    await page.fill('[data-testid="login-password"]', 'password123');

    // 5. Giriş butonuna tıkla
    await page.click('[data-testid="login-submit"]');

    // 6. Sonucu kontrol et
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
  });
});
```

---

## İpuçları ve En İyi Pratikler

### 1. UI Modunu Kullanın

```bash
npm run test:e2e:ui
```

Bu modda:
- Testleri seçip seçimli çalıştırabilirsiniz
- Her testin ne kadar sürdüğünü görebilirsiniz
- Hangi testin başarılı/başarısız olduğunu görsel olarak görün

### 2. Watch Mode

Testleri otomatik yeniden çalıştırın:

```bash
npx playwright test --ui
# UI'da "Watch Mode" butonuna tıklayın
```

Dosyaları her kaydettiğinizde testler otomatik yeniden çalışır.

### 3. Sadece Değiştiklerinizi Test Edin

Tüm testleri çalıştırmak yerine, üzerinde çalıştığınız dosyayı çalıştırın:

```bash
npx playwright test auth/login.spec.ts --ui
```

### 4. Hatalı Testleri Tekrar Çalıştırın

```bash
# Sadece başarısız olanları çalıştır
npx playwright test --only-failed
```

### 5. Testlere Anlamlı İsimler Verin

```typescript
// KÖTÜ
test('test1', async () => { ... });

// İYİ
test('kullanıcı hatalı şifre ile girememeli', async () => { ... });
```

### 6. Page Object Model Kullanın

Test kodunuzda tekrar eden kodları önleyin:

```typescript
// tests/e2e/helpers/pages.ts
export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
    await this.page.click('[data-testid="login-submit"]');
  }
}

// Test içinde
const auth = new AuthHelper(page);
await auth.login('test@test.com', 'password123');
```

---

## Ek Kaynaklar

### Resmi Dokümantasyon

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

### Proje Dokümantasyonu

- [Test Data Attributes](./test-data-attributes.md) - Test ID'leri için referans
- [E2E Implementation Summary](./e2e-implementation-summary.md) - E2E implementasyon detayları

### Topluluk

- [Playwright GitHub Discussions](https://github.com/microsoft/playwright/discussions)
- [Stack Overflow - Playwright Tag](https://stackoverflow.com/questions/tagged/playwright)

---

## Sorun Giderme Kontrol Listesi

Testleriniz çalışmıyorsa, bu adımları sırasıyla takip edin:

- [ ] Node.js kurulu mu? (`node --version`)
- [ ] npm bağımlılıkları yüklendi mi? (`npm install`)
- [ ] Playwright tarayıcıları indirildi mi? (`npx playwright install`)
- [ ] Doğru dizinde misiniz? (`pwd`)
- [ ] Port 8080 boş mu? (`netstat -ano | findstr :8080`)
- [ ] `.env` dosyası var mı ve doğru mu?
- [ ] `playwright.config.ts` doğru yapılandırılmış mı?
- [ ] Test dosyaları `tests/e2e/` dizininde mi?
- [ ] Helper dosyaları var mı?

---

## Hızlı Başlangıç Kontrol Listesi

İlk kez E2E test çalıştıracaklar için:

1. [ ] Node.js ve npm kurun
2. [ ] Projeyi klonlayın: `git clone <repo>`
3. [ ] Bağımlılıkları yükleyin: `npm install`
4. [ ] Playwright tarayıcılarını indirin: `npx playwright install`
5. [ ] `.env.example` dosyasını `.env` olarak kopyalayın
6. [ ] `.env` dosyasını Supabase bilgilerinizle doldurun
7. [ ] Test kullanıcılarını oluşturun: `npm run test-users:create`
8. [ ] Testleri çalıştırın: `npm run test:e2e:ui`

---

## SSS (Sıkça Sorulan Sorular)

### S: Testler ne kadar sürmeli?
**C:** İyi bir E2E test 1-5 saniye arasında sürmelidir. Daha uzunsa optimizasyon gerekebilir.

### S: Kaç test yeterli?
**C:** Kritik kullanıcı akışlarını (giriş, sepet, ödeme) kapsayan 10-20 test iyi bir başlangıçtır.

### S: Testler her çalıştırılmalı mı?
**C:** Evet, kod değişikliklerinden önce ve sonra testleri çalıştırın. CI/CD'de otomatik çalıştırın.

### S: Başarısız test ne yapmalıyım?
**C:**
1. `npm run test:e2e:ui` ile tekrar çalıştırın
2. Video ve screenshot'ları inceleyin
3. `npx playwright show-report` ile detaylı rapora bakın
4. Debug modunda adım adım inceleyin

### S: Testleri yazmak zor mu?
**C:** Değil! Playwright'nin Codegen aracı ile kod yazmadan test oluşturabilirsiniz:
```bash
npx playwright codegen http://localhost:8080
```

---

**Hazırlayan:** Claude Code
**Son Güncelleme:** 2025-01-04
**Sürüm:** 1.0
