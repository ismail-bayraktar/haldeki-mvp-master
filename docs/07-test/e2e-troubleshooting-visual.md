# E2E Test Sorun Giderme Rehberi (Görsel)

> Görsel diyagramlar ve adım adım çözümler ile sık karşılaşılan sorunları nasıl çözeceğinizi öğrenin

---

## Sorun 1: "Hiçbir Şey Olmadı" - Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│  "npm run test:e2e" komutunu çalıştırdım ama hiçbir şey olmadı    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  SORUN: Çıktı yok veya komut dondu       │
        └─────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ DURUM 1     │  │ DURUM 2     │  │ DURUM 3     │
    │             │  │             │  │             │
    │ Hata mesajı │  │ Boş çıktı  │  │ Komut dondu │
    └─────────────┘  └─────────────┘  └─────────────┘
```

### Çözüm Adımları

```
┌─────────────────────────────────────────────────────────────────┐
│  ADIM 1: Tarayıcılar kurulu mu?                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Çalıştır: npx playwright --version                             │
│                                                                 │
│  ├── Versiyon görünüyor mu?                                    │
│  │   ├── EVET → ADIM 2'ye geç                                 │
│  │   └── HAYIR → Aşağıdaki komutu çalıştır:                    │
│  │                                                              │
│  │       npm run test:setup                                    │
│  │       veya                                                  │
│  │       npx playwright install                                │
│  │                                                              │
│  └── Beklenen çıktı: "Version 1.57.0"                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADIM 2: Dizin doğru mu?                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Çalıştır: dir (Windows) veya ls (Unix)                         │
│                                                                 │
│  ├── package.json dosyasını görüyor musunuz?                   │
│  │   ├── EVET → ADIM 3'e geç                                  │
│  │   └── HAYIR → Doğru dizine gidin:                          │
│  │                                                              │
│  │       cd F:\donusum\haldeki-love\haldeki-market            │
│  │                                                              │
│  └── package.json ve tests/ klasörü görünmeli                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADIM 3: Port çakışması var mı?                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Çalıştır: netstat -ano | findstr :8080                         │
│                                                                 │
│  ├── Çıktı var mı?                                             │
│  │   ├── HAYIR → Port boş, ADIM 4'e geç                       │
│  │   └── EVET → Port kullanımda, çakışmayı çözün:             │
│  │                                                              │
│  │       1. PID numarasını kopyalayın (son sütun)              │
│  │       2. İşlemi sonlandırın:                                │
│  │          taskkill /PID <PID> /F                             │
│  │       3. Veya başka bir port kullanın                      │
│  │                                                              │
│  └── Boş çıktı = Port kullanımda değil                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADIM 4: Bağımlılıklar yüklü mü?                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Çalıştır: npm list @playwright/test                            │
│                                                                 │
│  ├── Versiyon bilgisi görünüyor mu?                            │
│  │   ├── EVET → ADIM 5'e geç                                  │
│  │   └── HAYIR → Bağımlılıkları yeniden yükleyin:             │
│  │                                                              │
│  │       npm install                                           │
│  │                                                              │
│  └── "@playwright/test@1.57.0" gibi bir çıktı bekleyin        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADIM 5: Test dosyaları var mı?                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Çalıştır: dir tests\e2e\*.spec.ts                             │
│                                                                 │
│  ├── Test dosyaları listeleniyor mu?                           │
│  │   ├── EVET → Test dosyaları mevcut                         │
│  │   └── HAYIR → Test dosyaları eksik                         │
│  │                                                              │
│  └── En az 4 .spec.ts dosyası olmalı                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sorun 2: Test Başarısız Oldu - Karar Ağacı

```
┌─────────────────────────────────────────────────────────────┐
│  Test başarısız oldu, ne yapmalıyım?                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Hata mesajını oku    │
            └───────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ TIMEOUT      │  │ NOT FOUND    │  │ AUTH FAILED  │
│ (Zaman aşımı)│  │ (Element yok) │  │ (Giriş hatası)│
└──────────────┘  └──────────────┘  └──────────────┘
```

### TIMEOUT Hatası Çözümü

```
┌─────────────────────────────────────────────────────────────┐
│  HATA: Test timeout of 30000ms exceeded                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SEBEP: Test çok uzun sürdü                                 │
│                                                             │
│  ÇÖZÜMLER:                                                   │
│  ─────────                                                   │
│  1. Testin timeout değerini artırın:                        │
│                                                             │
│     test('yavaş test', async ({ page }) => {               │
│       test.setTimeout(60000);  // 60 saniye                │
│       // ...                                                │
│     });                                                     │
│                                                             │
│  2. Veya global timeout artırın (playwright.config.ts):    │
│                                                             │
│     export default defineConfig({                          │
│       timeout: 60000,                                       │
│     });                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### NOT FOUND Hatası Çözümü

```
┌─────────────────────────────────────────────────────────────┐
│  HATA: locator.click: Target closed                         │
│  HATA: Element not found                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SEBEP: Element henüz yüklenmedi veya yok                    │
│                                                             │
│  ÇÖZÜMLER:                                                   │
│  ─────────                                                   │
│  1. Elementin görünmesini bekleyin:                         │
│                                                             │
│     await expect(page.locator('[data-testid="btn"]'))      │
│       .toBeVisible();                                       │
│                                                             │
│  2. Sayfanın yüklenmesini bekleyin:                         │
│                                                             │
│     await page.waitForLoadState('networkidle');            │
│                                                             │
│  3. data-testid özniteliğini kontrol edin:                 │
│                                                             │
│     <Button data-testid="login-submit">Giriş</Button>      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AUTH FAILED Hatası Çözümü

```
┌─────────────────────────────────────────────────────────────┐
│  HATA: Login failed - Invalid credentials                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SEBEP: Test kullanıcısı yok veya Supabase bağlantısı hatalı│
│                                                             │
│  ÇÖZÜMLER:                                                   │
│  ─────────                                                   │
│  1. Test kullanıcılarını oluşturun:                         │
│                                                             │
│     npm run test-users:create                              │
│                                                             │
│  2. .env dosyasını kontrol edin:                            │
│                                                             │
│     VITE_SUPABASE_URL=...                                   │
│     VITE_SUPABASE_ANON_KEY=...                              │
│                                                             │
│  3. Supabase bağlantısını test edin:                        │
│                                                             │
│     supabase status                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Sorun 3: Video ve Screenshot Yok

```
┌─────────────────────────────────────────────────────────────┐
│  Hata: Cannot find video/screenshot for failed test         │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Ayarlar doğru yapılandırılmış │
        │  mı kontrol edin              │
        └───────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  playwright.config.ts dosyasını açun ve şu ayarları         │
│  kontrol edin:                                               │
│                                                             │
│  export default defineConfig({                              │
│    use: {                                                   │
│      video: 'retain-on-failure',      ✓ Doğru              │
│      screenshot: 'only-on-failure',   ✓ Doğru              │
│      trace: 'on-first-retry',        ✓ Doğru              │
│    }                                                         │
│  });                                                        │
│                                                             │
│  Sonra test-results/ klasörünü kontrol edin:                │
│                                                             │
│  test-results/                                              │
│  ├── 01-04-2025_10-30-15-test-results/                     │
│  │   ├── login.spec.ts/                                     │
│  │   │   ├── video.webm     ← Video burada                  │
│  │   │   └── screenshot.png  ← Screenshot burada            │
│  │   └── trace.zip         ← Trace burada                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Sorun 4: "Cannot find module"

```
┌─────────────────────────────────────────────────────────────┐
│  HATA: Cannot find module './helpers/pages'                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │  Modül eksik veya yanlış  │
        │  import yolu              │
        └───────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ÇÖZÜM 1     │  │ ÇÖZÜM 2     │  │ ÇÖZÜM 3     │
│             │  │             │  │             │
│ node_modules│  │ Dosya yolu  │  │ Dosya adı   │
│ temizle     │  │ kontrol et  │  │ kontrol et  │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ÇÖZÜM 1: node_modules temizle                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Windows:                                                   │
│  rmdir /s /q node_modules                                   │
│  del package-lock.json                                      │
│  npm install                                                │
│                                                             │
│  Unix/Linux:                                                │
│  rm -rf node_modules package-lock.json                      │
│  npm install                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ÇÖZÜM 2: Dosya yolunu kontrol edin                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  import { PageFactory } from '../../helpers/pages';        │
│                                                             │
│  Test dosyası: tests/e2e/auth/login.spec.ts                │
│  Hedef dosya:  tests/e2e/helpers/pages.ts                   │
│                                                             │
│  .. bir üst klasöre çıkar                                   │
│  ../../ iki üst klasöre çıkar                               │
│                                                             │
│  Yapı:                                                      │
│  tests/e2e/                                                 │
│  ├── helpers/                                               │
│  │   └── pages.ts                                           │
│  └── auth/                                                  │
│      └── login.spec.ts  (buradan ../../helpers/)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Sonuçlarını Okuma - Görsel Kılavuz

### Başarılı Test Çıktısı

```
Running 15 tests using 3 workers
  ✓ [chromium] › auth/login.spec.ts:18:5 › should allow customer to login (2.3s)
  ✓ [chromium] › auth/login.spec.ts:32:5 › should show error with invalid credentials (1.8s)
  ✓ [firefox]  › auth/login.spec.ts:48:5 › should allow admin to login (2.1s)
  ✓ [webkit]   › checkout/checkout.spec.ts:20:5 › should complete checkout (4.5s)
  ...

  15 passed (12.3s)

┌─ Anlamı ───────────────────────────────────────────────────┐
│ ✓ = Test BAŞARILI                                           │
│ [chromium] = Hangi tarayıcı?                                 │
│ auth/login.spec.ts = Hangi dosya?                           │
│ :18:5 = Hangi satır?                                        │
│ should allow... = Testin adı                                │
│ (2.3s) = Testın süresi                                      │
│ 15 passed = 15 test başarılı                                │
│ (12.3s) = Toplam süre                                       │
└─────────────────────────────────────────────────────────────┘
```

### Başarısız Test Çıktısı

```
Running 15 tests using 3 workers
  ✗ [chromium] › auth/login.spec.ts:18:5 › should allow customer to login (2.3s)

    Error: expect(page).toHaveURL(/\/giris/)

    Expected: "/giris"
    Received: "/"

    at auth/login.spec.ts:28:17

  14 passed | 1 failed

┌─ Hata Analizi ─────────────────────────────────────────────┐
│ ✗ = Test BAŞARISIZ                                          │
│                                                              │
│ HATA: URL beklenen değerde değil                             │
│                                                              │
│ Expected (/giris):  Test "/giris" sayfasında olmalıydı       │
│ Received (/):      Ama test "/" sayfasında                   │
│                                                              │
│ Yani: Kullanıcı giriş yaptıktan sonra ana sayfaya yönlendi    │
│      ama test giriş sayfasında olmasını bekliyordu            │
│                                                              │
│ Çözüm: Test beklentisini düzeltün veya kodu düzeltin         │
│                                                              │
│ at auth/login.spec.ts:28:17                                  │
│    └─ Hata auth/login.spec.ts dosyasının 28. satırında       │
└─────────────────────────────────────────────────────────────┘
```

---

## HTML Raporu Kullanımı

```
┌─────────────────────────────────────────────────────────────┐
│  1. Raporu açın                                             │
│                                                             │
│     npx playwright show-report                              │
│     veya                                                   │
│     Çift tıklayın: test-results/index.html                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  2. Tarayıcıda rapor açılacak                                │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │  Playwright Test Report                  │            │
│     ├─────────────────────────────────────────┤            │
│     │  Environment: chromium                   │            │
│     │  Duration: 12.3s                         │            │
│     │  Passed: 14  Failed: 1                   │            │
│     ├─────────────────────────────────────────┤            │
│     │  ✓ auth/login.spec.ts (8)               │            │
│     │  ✗ checkout.spec.ts (1)  ← Tıklayın     │            │
│     │  ✓ admin/approval.spec.ts (6)           │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  3. Başarısız testi tıklayın                                │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │  Test: should complete checkout          │            │
│     │  Status: Failed                          │            │
│     │  Duration: 4.5s                          │            │
│     ├─────────────────────────────────────────┤            │
│     │  [Screenshot]                            │            │
│     │  ┌───────────────────────────────────┐  │            │
│     │  │  Hata anındaki ekran görüntüsü    │  │            │
│     │  └───────────────────────────────────┘  │            │
│     │                                         │            │
│     │  [Video ▶]                              │            │
│     │  Test çalışması video kaydı             │            │
│     │                                         │            │
│     │  [Trace]                                │            │
│     │  Detaylı adım adım trace                │            │
│     │                                         │            │
│     │  Error: Element not found...            │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Debug Modu Kullanımı

```
┌─────────────────────────────────────────────────────────────┐
│  Debug modunu başlat:                                       │
│                                                             │
│     npm run test:e2e:debug                                  │
│     veya                                                   │
│     npx playwright test --debug                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Playwright Inspector açılacak:                             │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │  Playwright Inspector                    │            │
│     ├─────────────────────────────────────────┤            │
│     │  ▶ Step Over (F10)    → Sonraki adım    │            │
│     │  ⏸ Pause (F9)        │                  │            │
│     │  ↻ Resume (F8)       │                  │            │
│     ├─────────────────────────────────────────┤            │
│     │  Locator:                               │            │
│     │  [Pick selector]  → Ekrandan seçin     │            │
│     │  page.locator('[data-testid="..."]')   │            │
│     ├─────────────────────────────────────────┤            │
│     │  Watch:                                 │            │
│     │  > page.url()                           │            │
│     │    "http://localhost:8080/"             │            │
│     │  > await page.title()                   │            │
│     │    "Haldeki Market"                     │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
│  Kullanım:                                                   │
│  - F9: Breakpoint koy                                       │
│  - F10: Sonraki adıma geç                                   │
│  - F8: Devam et                                             │
│  - Pick selector: Ekrandan element seçin                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Hızlı Kontrol Listesi

```
┌─ Test Çalıştırma Kontrol Listesi ──────────────────────────┐
│                                                             │
│  [ ] Node.js kurulu mu?    (node --version)                │
│  [ ] npm install çalıştırıldı mı?                          │
│  [ ] Playwright kurulu mu?  (npm run test:setup)           │
│  [ ] Port 8080 boş mu?      (netstat -ano | findstr :8080) │
│  [ ] .env dosyası var mı?                                  │
│  [ ] Test kullanıcıları oluşturuldu mu?                    │
│  [ ] Doğru dizinde misiniz?  (pwd)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Test Başarısız Oldu Kontrol Listesi ───────────────────────┐
│                                                             │
│  [ ] Hata mesajını okudun mu?                              │
│  [ ] Video'yu izledin mi?     (npx playwright show-report)  │
│  [ ] Screenshot'a baktın mı?                               │
│  [ ] Element var mı?          (Tarayıcıda manuel kontrol)   │
│  [ ] Test ID doğru mu?       (data-testid="...")           │
│  [ ] Bekleme süresi yeterli mi?                             │
│  [ ] Authentication başarılı mı?                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**İpucu:** Bu görsel rehberi yanınızda bulundurun - her hata olduğunda bakın!

**Son Güncelleme:** 2025-01-04
