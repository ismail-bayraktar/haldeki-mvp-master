# 08. Deployment

> Deployment ve operasyon rehberleri

---

## Bu Klasör

Production deployment, environment yönetimi ve operasyon prosedürleri.

---

## İçindekiler

| Dosya | Konu | Ne Zaman Kullanılır? |
|-------|------|---------------------|
| [production-deployment.md](./production-deployment.md) | Production deploy adımları | Yeni versiyon release |
| [environment-konfigurasyonu.md](./environment-konfigurasyonu.md) | Environment variable'lar | Kurulum ve konfigürasyon |
| [rollback-proseduru.md](./rollback-proseduru.md) | Rollback adımları | Sorun durumunda |
| [ci-cd.md](./ci-cd.md) | CI/CD pipeline yapısı | Pipeline kurulumu |

---

## Deployment Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT                              │
│  Local → Feature Branch → PR → Merge to main                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                        CI/CD                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Lint    │→ │  Test    │→ │  Build   │→ │  Deploy  │   │
│  │  Check   │  │  Run     │  │  Create  │  │  Vercel  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      ENVIRONMENTS                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Staging    │  │  Production │  │   Preview   │         │
│  │  (Test)     │  │  (Live)     │  │  (PR Demo)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## Deployment Checklist

### Öncesi
- [ ] Tüm testler geçiyor
- [ ] Code review tamamlandı
- [ ] Migration script'leri hazır
- [ ] Environment variable'lar kontrol edildi
- [ ] Database backup alındı

### Sırasında
- [ ] Staging'de test edildi
- [ ] Production deployment başlatıldı
- [ ] Monitor paneli açık
- [ ] Rollback planı hazır

### Sonrası
- [ ] Health check başarılı
- [ ] Temel fonksiyonlar test edildi
- [ ] Error loglar kontrol edildi
- [ ] Performance metrics kaydedildi

---

## Emergency Contacts

| Rol | Kişi | Telefon | Slack |
|-----|------|---------|-------|
| Tech Lead | - | - | @tech-lead |
| DevOps | - | - | @devops |
| Product Manager | - | - | @pm |

---

## İlgili Dokümanlar

- [Troubleshooting](../10-bakim/troubleshooting.md)
- [Monitoring](../10-bakim/monitoring.md)

---

**Son güncelleme:** 2026-01-10
