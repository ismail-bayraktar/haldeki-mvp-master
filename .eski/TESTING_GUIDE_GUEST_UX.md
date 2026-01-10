# Guest UX Improvements - Testing Guide

**Dev Server:** http://localhost:8081
**Tarih:** 2026-01-08
**Amaç:** Guest kullanıcı UX iyileştirmelerini test etme

---

## 🧪 Test Senaryoları

### Test 1: White Screen Fix (Ana Test)

**Adımlar:**
1. Browser'da incognito/private window aç
2. `http://localhost:8081/urunler` URL'ine git
3. Bekle ve gör

**Beklenen Sonuç:**
- ✅ Otomatik olarak ana sayfaya yönlendirilmelisin
- ✅ URL `http://localhost:8081/#whitelist-form` olmalı
- ✅ Sayfa "Erken Erişim Listesi" formuna smooth scroll yapmalı
- ✅ Beyaz ekran görmemelisin
- ✅ Form görünüyor olmalı

**Hata Durumu:**
- ❌ Beyaz ekran görüyorsan → ProtectedRoute çalışmıyor
- ❌ Forma scroll yapmıyorsa → useEffect logic yanlış

---

### Test 2: Guest Badge Görünürlük

**Adımlar:**
1. Incognito window'da ana sayfaya git (`http://localhost:8081/`)
2. Header'ın sağ tarafını kontrol et

**Beklenen Sonuç:**
- ✅ "Üye ol" yazılı bir badge görüyor olmalısın
- ✅ Badge'in yanında UserPlus icon olmalı
- ✅ Renk: Accent color (yeşil tonu)
- ✅ Badge pill-shaped (rounded) olmalı
- ✅ Hover yapınca büyümeli (scale effect)

**Hata Durumu:**
- ❌ Badge yoksa → Header.tsx integration kontrol et
- ❌ Mobilde görüyorsan → Responsive class yanlış (hidden sm:flex)

---

### Test 3: Guest Badge Click (Ana Sayfada)

**Adımlar:**
1. Ana sayfada ol (`http://localhost:8081/`)
2. "Üye ol" badge'ine tıkla

**Beklenen Sonuç:**
- ✅ Sayfa "Başvuru Formu" section'ına smooth scroll yapmalı
- ✅ Form viewport'un içinde görünür olmalı
- ✅ URL hash değişmemeli (zaten ana sayfadayız)

**Hata Durumu:**
- ❌ Scroll yapmıyorsa → getElementById yanlış
- ❌ Form bulunamıyorsa → WhitelistLanding.tsx ID kontrol et

---

### Test 4: Guest Badge Click (Başka Sayfada)

**Adımlar:**
1. `http://localhost:8081/nasil-calisir` sayfasına git
2. "Üye ol" badge'ine tıkla

**Beklenen Sonuç:**
- ✅ Önce ana sayfaya navigate olmalı
- ✅ Sonra forma smooth scroll yapmalı
- ✅ Toplam süre < 1 saniye olmalı

**Hata Durumu:**
- ❌ Navigate yapmıyorsa → navigate() fonksiyonu çalışmıyor
- ❌ Scroll yapmıyorsa → setTimeout timing yanlış

---

### Test 5: Navigation Menu Click (Bugün Halde)

**Adımlar:**
1. Incognito window'da ana sayfaya git
2. Header'da "Bugün Halde" linkine tıkla (mobil menu olabilir)

**Beklenen Sonuç:**
- ✅ Önce /bugun-halde sayfasına gitmeye çalışmalı
- ✅ ProtectedRoute devreye girmeli
- ✅ Ana sayfaya redirect olmalı
- ✅ Forma smooth scroll yapmalı

**Hata Durumu:**
- ❌ /bugun-halde sayfasında kalıyorsa → ProtectedRoute wrapper eksik
- ❌ Beyaz ekran → useEffect redirect logic yanlış

---

### Test 6: Navigation Menu Click (Ürünler)

**Adımlar:**
1. Ana sayfada ol
2. "Ürünler" linkine tıkla

**Beklenen Sonuç:**
- ✅ /urunler sayfasına gitmeye çalışmalı
- ✅ ProtectedRoute intercept etmeli
- ✅ Ana sayfa + form redirect

**Hata Durumu:**
- ❌ /urunler sayfasında kalıyorsa → App.tsx route wrapper eksik

---

### Test 7: Redirect Loop Prevention

**Adımlar:**
1. /#whitelist-form URL'ine git (manuel olarak)
2. Sayfayı refresh et (F5)

**Beklenen Sonuç:**
- ✅ Sayfa refresh olmalı
- ✅ Ana sayfada kalmalı
- ✅ Form görünür olmalı
- ✅ Infinite redirect loop olmamalı

**Hata Durumu:**
- ❌ Sayfa sürekli redirect yapıyorsa → hasRedirectedToHome state yanlış

---

### Test 8: Back Button Behavior

**Adımlar:**
1. /urunler URL'ine git (redirect olmalı)
2. Browser back button'ına tıkla

**Beklenen Sonuç:**
- ✅ Önceki sayfaya gitmeli (veya ana sayfa)
- ✅ Redirect history'de replace olduğu için düzgün çalışmalı

**Hata Durumu:**
- ❌ Back button çalışmıyorsa → replace: true parametresi sorunlu

---

### Test 9: Customer Login (Badge Disappear)

**Adımlar:**
1. Incognito window'da "Üye ol" badge'ini gör
2. Login formunu aç (User icon)
3. Test customer hesabı ile giriş yap

**Beklenen Sonuç:**
- ✅ Login başarılı olmalı
- ✅ "Üye ol" badge kaybolmalı
- ✅ "Ürünleri İncele" butonu görünmeli (landing page'de)

**Hata Durumu:**
- ❌ Badge hala görünüyorsa → !isAuthenticated kontrolü yanlış

---

### Test 10: Mobile Responsive

**Adımlar:**
1. Browser devtools aç (F12)
2. Mobile device simulation seç (iPhone 14 Pro)
3. Ana sayfaya git

**Beklenen Sonuç:**
- ✅ "Üye ol" badge **GİZLİ** olmalı (mobile)
- ✅ Hamburger menu çalışmalı
- ✅ Mobile menu'de "Giriş Yap" butonu görünmeli

**Hata Durumu:**
- ❌ Mobile'da badge görüyorsan → Tailwind class yanlış (should be hidden sm:flex)

---

## 🐛 Known Issues & Workarounds

### Issue 1: Form ID Mismatch
**Symptom:** Badge tıklayınca scroll yapmıyor
**Fix:** `WhitelistLanding.tsx` dosyasında `<section id="whitelist-form">` olduğundan emin ol

### Issue 2: ProtectedRoute Wrapper Missing
**Symptom:** /urunler sayfasına gidince beyaz ekran
**Fix:** `App.tsx` dosyasında route'u kontrol et:
```tsx
<Route path="/urunler" element={
  <ProtectedRoute requireAuth={true}>
    <Products />
  </ProtectedRoute>
} />
```

### Issue 3: AuthContext Role Check Delay
**Symptom:** Login sonrası hemen redirect olmuyor
**Fix:** `isRolesChecked` flag bekle (ProtectedRoute'ta var)

---

## 📊 Test Results Template

Test sonucunu bu template'e doldur:

```markdown
## Test Sonuçları

**Tester:** [İsim]
**Tarih:** 2026-01-08
**Browser:** [Chrome/Firefox/Safari]
**Device:** [Desktop/Mobile]

| Test | Sonuç | Notlar |
|------|-------|--------|
| Test 1: White Screen Fix | ✅/❌ | |
| Test 2: Badge Görünürlük | ✅/❌ | |
| Test 3: Badge Click (Ana Sayfa) | ✅/❌ | |
| Test 4: Badge Click (Diğer Sayfa) | ✅/❌ | |
| Test 5: Nav Click (Bugün Halde) | ✅/❌ | |
| Test 6: Nav Click (Ürünler) | ✅/❌ | |
| Test 7: Redirect Loop | ✅/❌ | |
| Test 8: Back Button | ✅/❌ | |
| Test 9: Customer Login | ✅/❌ | |
| Test 10: Mobile Responsive | ✅/❌ | |

**Genel Değerlendirme:**
- Başarılı: X/10
- Kritik hatalar: [listele]
- Öneriler: [notlar]
```

---

## 🎯 Quick Verification (5 Dakika)

Hızlı test için sadece bunları yap:

1. ✅ **Incognito aç → /urunler yaz → Enter**
   - Ana sayfaya gitti mi? Evet/Hayır

2. ✅ **Header'da "Üye ol" badge görüyor musun?**
   - Görüyorum/Göremiyorum

3. ✅ **Badge'e tıkla → Forma scroll yaptı mı?**
   - Evet/Hayır

4. ✅ **"Bugün Halde" linkine tıkla → Redirect mi oldu?**
   - Evet/Hayır

**4/4 Evet** → Her şey çalışıyor! 🎉
**Herhangi bir Hayır** → Debugging gerekli.

---

## 📞 Sorun Bildirme

Test sırasında sorun yaşarsan:

1. **Screenshot al** (console açıkken)
2. **Console errors** kontrol et
3. **Network tab**'da failed request var mı bak
4. **Browser ve versiyon** not et
5. **Adımları** detaylı yaz

---

**Hazırlayan:** Claude Code (Frontend Specialist + Debugger Agents)
**Durum:** Ready for testing
**Dev Server:** http://localhost:8081
