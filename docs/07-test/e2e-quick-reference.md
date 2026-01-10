# E2E Test Hızlı Referans Kartı

> Bu dosyayı yanınızda bulundurun - hızlı komutlara ihtiyacınız olduğunda kullanın

---

## Temel Komutlar

```bash
# Tüm E2E testlerini çalıştır
npm run test:e2e

# UI modunda çalıştır (GÖRSEL)
npm run test:e2e:ui

# Debug modunda çalıştır (ADIM ADIM)
npm run test:e2e:debug

# Tarayıcıyı göstererek çalıştır
npm run test:e2e:headed

# Tüm testleri çalıştır (unit + e2e)
npm run test:all
```

---

## Belirli Testleri Çalıştır

```bash
# Tek bir dosya
npx playwright test auth/login.spec.ts

# İsmine göre filtrele
npx playwright test -g "Login"

# Satır numarasına göre
npx playwright test --line 25

# Sadece başarısız olanları
npx playwright test --only-failed
```

---

## Tarayıcı Seçenekleri

```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# Tüm tarayıcılar (varsayılan)
npx playwright test
```

---

## Geliştirme Komutları

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıları indir (ilk kurulum)
npx playwright install

# Kurulumu doğrula
npx playwright --version

# Raporu görüntüle
npx playwright show-report
```

---

## Test Oluşturma

```bash
# Codegen ile kayıt (kod yazmadan test oluştur)
npx playwright codegen http://localhost:8080

# Yeni test dosyası oluştur
npx playwright codegen --target=javascript tests/e2e/example.spec.ts
```

---

## Faydalı Bayraklar

| Bayrak | Kısa Açıklama | Örnek |
|--------|--------------|-------|
| `--ui` | UI modunda açar | `npx playwright test --ui` |
| `--headed` | Tarayıcıyı göster | `npx playwright test --headed` |
| `--debug` | Debug modu | `npx playwright test --debug` |
| `-g` | İsme göre filtrele | `npx playwright test -g "Login"` |
| `--project` | Tarayıcı seç | `npx playwright test --project=chromium` |
| `--workers` | Worker sayısı | `npx playwright test --workers=1` |
| `--repeat-each` | Her testi tekrarla | `npx playwright test --repeat-each=3` |
| `--timeout` | Zaman aşımı (ms) | `npx playwright test --timeout=60000` |
| `--retries` | Tekrar deneme sayısı | `npx playwright test --retries=2` |

---

## Yaygın Komut Birleşimleri

```bash
# Sadece login testlerini UI modunda
npx playwright test auth/login.spec.ts --ui

# Tek worker, headed modda
npx playwright test --workers=1 --headed

# Login testlerini chromium'da, debug modda
npx playwright test auth/login.spec.ts --project=chromium --debug

# 3 kez tekrarla, rapor oluştur
npx playwright test --repeat-each=3 --reporter=html
```

---

## Sorun Giderme Komutları

```bash
# Port 8080'i kullanan işlemi bul (Windows)
netstat -ano | findstr :8080

# Port 8080'i kullanan işlemi sonlandır (PID kullanarak)
taskkill /PID <PID_NUMBER> /F

# Node modüllerini temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install

# Playwright cache'i temizle
npx playwright install --force

# Test sonuçlarını temizle
rm -rf test-results/
```

---

## Raporlama

```bash
# HTML raporu oluştur ve aç
npx playwright show-report

# JUnit XML raporu (otomatik oluşturulur)
# test-results/junit.xml

# JSON raporu
npx playwright test --reporter=json
```

---

## Test Kullanıcıları

```bash
# Test kullanıcılarını oluştur
npm run test-users:create

# Supabase fonksiyonunu deploy et
supabase functions deploy create-test-users
```

---

## Test Verisi Yönetimi

```bash
# Test veritabanını sıfırla
supabase db reset

# Test migration'larını çalıştır
supabase db push

# Seed verilerini yükle
supabase db seed
```

---

## En Sık Kullanılan 5 Komut

| Sıra | Komut | Ne İşe Yarar |
|------|-------|--------------|
| 1 | `npm run test:e2e:ui` | Testleri görsel olarak çalıştır |
| 2 | `npm run test:e2e` | Tüm testleri hızlıca çalıştır |
| 3 | `npm run test:e2e:debug` | Hata ayıklama modunda çalıştır |
| 4 | `npx playwright test -g "<isim>"` | Belirli testi çalıştır |
| 5 | `npx playwright show-report` | Sonuç raporunu görüntüle |

---

## Cheat Sheet (Tek Sayfa)

```
┌─────────────────────────────────────────────────────────────┐
│  E2E TEST HIZLI CHEAT SHEET                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TEMEL KOMUTLAR                                             │
│  ────────────────                                           │
│  npm run test:e2e           → Tüm testler                   │
│  npm run test:e2e:ui        → UI modu (görsel)             │
│  npm run test:e2e:debug     → Debug modu                    │
│                                                             │
│  BELİRLİ TESTLER                                            │
│  ─────────────────                                    │
│  npx playwright test dosya.spec.ts                          │
│  npx playwright test -g "Login"                             │
│                                                             │
│  TARAYICILAR                                                │
│  ────────────                                               │
│  --project=chromium    → Chromium                           │
│  --project=firefox     → Firefox                            │
│  --project=webkit      → WebKit                             │
│                                                             │
│  KURULUM                                                    │
│  ───────                                                    │
│  npx playwright install  → Tarayıcıları indir               │
│  npm install            → Bağımlılıkları yükle              │
│                                                             │
│  RAPORLAR                                                   │
│  ─────────                                                  │
│  npx playwright show-report  → HTML raporu aç               │
│                                                             │
│  SORUN GIDERME                                              │
│  ───────────────                                            │
│  netstat -ano | findstr :8080   → Port kontrolü             │
│  rm -rf node_modules && npm install → Temiz kurulum         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Notlar

- **İlk kez çalıştırıyorsanız:** Önce `npx playwright install` komutunu çalıştırın
- **Testleri görmek istiyorsanız:** `npm run test:e2e:ui` kullanın
- **Hata ayıklama yaparken:** `npm run test:e2e:debug` kullanın
- **Port çakışması:** Port 8080'in boş olduğundan emin olun
- **Yardım:** `npx playwright test --help`

---

**İpucu:** Bu dosyayı bookmarklayın veya yazdırın - her zaman ihtiyacınız olacak!
