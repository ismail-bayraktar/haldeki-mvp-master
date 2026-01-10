# 10. Bakım

> Bakım ve monitoring rehberleri

---

## Bu Klasör

Sistem monitoring, troubleshooting, backup ve recovery prosedürleri.

---

## İçindekiler

| Dosya | Konu | Aciliyet |
|-------|------|----------|
| [monitoring.md](./monitoring.md) | Monitoring ve alerting kurulumu | Yüksek |
| [backup-recovery.md](./backup-recovery.md) | Backup ve recovery prosedürleri | Kritik |
| [troubleshooting.md](./troubleshooting.md) | Common sorunlar ve çözümler | Acil |
| [maintenance-schedule.md](./maintenance-schedule.md) | Planlı bakım takvimi | Orta |

---

## Monitoring Dashboard

### Metrikler

| Kategori | Metrik | Alert Threshold |
|----------|--------|-----------------|
| **Uptime** | Site erişilebilirliği | < 99.9% |
| **Response Time** | API yanıt süresi | > 500ms |
| **Error Rate** | Hata oranı | > 1% |
| **Database** | Connection pool | > 80% kullanım |
| **Storage** | Disk kullanımı | > 85% dolu |

### Monitoring Stack

```
┌────────────────────────────────────────────────────────┐
│                    Vercel Analytics                    │
│  - Uptime monitoring                                   │
│  - Response time tracking                              │
│  - Error logging                                       │
└────────────────────────────────────────────────────────┘
           ↓                          ↓
┌─────────────────────┐  ┌─────────────────────┐
│   Supabase Logs     │  │   Brevo Dashboard   │
│  - Query logs       │  │  - Email metrics    │
│  - Auth events      │  │  - Delivery rate    │
│  - RLS violations   │  │  - Bounce rate      │
└─────────────────────┘  └─────────────────────┘
```

---

## Backup Strategy

### Database Backup

| Sıklık | Tip | Retention | Lokasyon |
|--------|-----|-----------|----------|
| Saatlik | Incremental | 24 saat | Supabase |
| Günlük | Full | 30 gün | Supabase |
| Haftalık | Full | 3 ay | AWS S3 |

### Backup Test

```bash
# Her ayın ilk Pazarı
1. Production backup'ı indir
2. Staging'e restore et
3. Temel fonksiyonları test et
4. Sonucu raporla
```

---

## Troubleshooting Flow

```
Soru Bildirimi
     ↓
1. Kategorize et (Auth / Database / UI / Performance)
     ↓
2. İlgili dokümanı kontrol et
     ↓
3. Logları incele
     ↓
4. Çözüm uygula
     ↓
5. Test et ve dokümente et
```

---

## İlgili Dokümanlar

- [Production Deployment](../08-deployment/production-deployment.md)
- [Rollback Prosedürü](../08-deployment/rollback-proseduru.md)

---

**Son güncelleme:** 2026-01-10
