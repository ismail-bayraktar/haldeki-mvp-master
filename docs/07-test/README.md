# 07. Test

> Test stratejileri ve raporları

---

## Bu Klasör

Test yaklaşımı, senaryolar ve sonuç raporları.

---

## İçindekiler

| Dosya | Konu | Tip |
|-------|------|-----|
| [test-stratejisi.md](./test-stratejisi.md) | Genel test yaklaşımı | Strateji |
| [e2e-test-senaryolari.md](./e2e-test-senaryolari.md) | E2E test senaryoları | Senaryo |
| [test-raporlari.md](./test-raporlari.md) | Test sonuçları | Rapor |
| [unit-test-rehberi.md](./unit-test-rehberi.md) | Unit test yazma rehberi | Rehber |

---

## Test Pyramid

```
                    ┌──────────────┐
                    │    E2E       │  %10
                    │  (Playwright)│
                    └──────────────┘
                  ┌──────────────────┐
                  │    Integration   │  %30
                  │    (React Test)  │
                  └──────────────────┘
                ┌────────────────────────┐
                │       Unit Tests        │  %60
                │    (Vitest + Jest)     │
                └────────────────────────┘
```

---

## Test Kategorileri

### Unit Tests
- Component render testleri
- Hook logic testleri
- Utility fonksiyon testleri
- Form validasyon testleri

### Integration Tests
- API entegrasyon testleri
- State management testleri
- Database transaction testleri

### E2E Tests
- Kullanıcı journey'leri
- Cross-browser testleri
- Mobile responsive testleri

---

## Kapsama Alanı

| Modül | Unit | Integration | E2E |
|-------|------|-------------|-----|
| Auth | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ |
| Cart | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ✅ | ✅ |
| Supplier Panel | ✅ | ✅ | ✅ |

---

## İlgili Dokümanlar

- [Kod Standartları](../06-gelistirme/kod-standartlari.md)
- [Deployment - CI/CD](../08-deployment/ci-cd.md)

---

**Son güncelleme:** 2026-01-10
