# Güvenlik Testi - Kullanım Kılavuzu

Bu kılavuz, `optimize-image` Edge Function'ının güvenlik testlerini nasıl çalıştıracağınızı açıklar.

## Hızlı Başlangıç

### 1. JWT Token Alın

Testleri çalıştırmak için geçerli bir Supabase JWT token'ına ihtiyacınız var.

#### Yöntem A: Browser (En Kolay)

1. Uygulamanıza giriş yapın
2. Tarayıcıda F12'ye basarak Developer Tools'u açın
3. **Application** sekmesine gidin
4. **Local Storage** → Supabase URL'inizi bulun
5. `sb-<project-ref>-auth-token` anahtarının değerini kopyalayın

#### Yöntem B: Supabase CLI

```bash
npx supabase login
npx supabase projects list

# Kullanıcı oluşturun
npx supabase auth signup --email test@example.com --password password123
```

#### Yöntem C: Curl ile Login

```bash
curl -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Response'tan `access_token` değerini alın.

---

### 2. Test Script'ini Çalıştırın

#### Windows (Git Bash / WSL):

```bash
bash scripts/run-security-tests.sh <YOUR_JWT_TOKEN>
```

#### macOS / Linux:

```bash
chmod +x scripts/run-security-tests.sh
./scripts/run-security-tests.sh <YOUR_JWT_TOKEN>
```

#### Token olmadan (sadece unauthorized testler):

```bash
bash scripts/run-security-tests.sh
```

---

### 3. Test Sonuçlarını Okuyun

Script her test için:
- Test adını
- İstek detaylarını
- Sunucu yanıtını
- Pass/Fail sonucunu

gösterecektir.

Örnek çıktı:
```
====================================
SECURITY TEST SUITE
Edge Function: optimize-image
====================================
JWT token provided. Running all tests.

Test: Test 1.1: No Authorization Header
Request: -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image -H Content-Type: application/json -d {"bucketId": "product-images", "path": "test.jpg"}
Response:
{"error":"Unauthorized","details":"Geçerli bir Authorization header gerekli"}
[PASS] Test 1.1: No Authorization Header

...
====================================
TEST SUMMARY
====================================
Total Tests: 17
Passed: 17
Failed: 0
====================================
All tests passed!
```

---

## Manuel Test ( curl ile )

Script kullanmak istemiyorsanız, testleri manuel olarak da çalıştırabilirsiniz:

### Test 1: Authorization Yok (Beklenen: 401)

```bash
curl -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image \
  -H "Content-Type: application/json" \
  -d '{"bucketId": "product-images", "path": "test.jpg"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Test 2: Geçersiz Token (Beklenen: 401)

```bash
curl -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image \
  -H "Authorization: Bearer fake-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"bucketId": "product-images", "path": "test.jpg"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Test 3: Path Traversal (Beklenen: 400)

```bash
curl -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"bucketId": "product-images", "path": "../../../etc/passwd"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Test 4: Geçerli İstek (Beklenen: 200 veya 404 - dosya yoksa)

```bash
curl -X POST https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"bucketId": "product-images", "path": "products/test.jpg"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Beklenen HTTP Status Kodları

| Test | Beklenen Status | Açıklama |
|------|-----------------|----------|
| No token | 401 | Authorization header eksik |
| Invalid token | 401 | Token geçersiz |
| Missing params | 400 | bucketId veya path eksik |
| Invalid bucket | 400 | bucketId != "product-images" |
| Path traversal | 400 | "../" içeriyor |
| Invalid method | 405 | GET, PUT, DELETE |
| Valid request | 200 | Başarılı optimizasyon |

---

## Sorun Giderme

### "Permission denied" hatası

```bash
chmod +x scripts/run-security-tests.sh
```

### "Invalid token" hatısı

Token'nın geçerli olduğundan emin olun:
- Token süresi dolmamış olmalı
- Token aynı Supabase projesinden olmalı
- Kullanıcının oturum açmış olması gerekir

### Connection hatası

- İnternet bağlantınızı kontrol edin
- Supabase projenizin "paused" olmadığından emin olun
- Edge Function'ın deployed olduğunu doğrulayın

---

## Test Detayları

### Test Kategorileri

1. **Authorization Tests (4 test)**
   - No Authorization header
   - Empty Authorization header
   - Invalid token
   - Malformed header

2. **HTTP Method Tests (3 test)**
   - GET method
   - PUT method
   - DELETE method

3. **Input Validation Tests (3 test)**
   - Missing required parameters
   - Missing bucketId
   - Missing path

4. **Path Traversal Tests (5 test)**
   - Basic ../ attack
   - Double-dot variant
   - Absolute path
   - Null byte injection
   - Invalid characters

5. **Valid Request Test (1 test)**
   - Correct request structure

---

## Güvenlik Test Raporu

Detaylı test sonuçları için `docs/SECURITY-TEST-REPORT.md` dosyasına bakın.

---

## İleri Düzey Testler

### Load Test (Apache Bench)

```bash
ab -n 1000 -c 10 \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -p post.json \
  https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image
```

`post.json`:
```json
{"bucketId": "product-images", "path": "test.jpg"}
```

### Fuzzing Test (ffuf)

```bash
ffuf -w /path/to/wordlist.txt \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"bucketId": "product-images", "path": "FUZZ"}' \
  -u https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image \
  -mc 200,400,401
```

---

## Destek

Sorularınız için:
1. `docs/SECURITY-TEST-REPORT.md` dosyasını okuyun
2. Edge Function kodunu inceleyin: `supabase/functions/optimize-image/index.ts`
3. Supabase loglarını kontrol edin
