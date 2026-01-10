# Supabase RPC Deployment

Otomatik deployment scripti kullanarak `delete_supplier_image` fonksiyonunu Supabase'e deploy edin.

## Hızlı Kullanım

```bash
npm run deploy:rpc
```

## Ön Koşullar

1. `DATABASE_URL` environment variable ayarlanmış olmalı
2. Supabase projenize erişiminiz olmalı

## DATABASE_URL Ayarlama

### .env Dosyası (Önerilen)

`.env` dosyanıza ekleyin:

```env
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Komut Satırı

**Windows CMD:**
```cmd
set DATABASE_URL="postgres://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
npm run deploy:rpc
```

**PowerShell:**
```powershell
$env:DATABASE_URL="postgres://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
npm run deploy:rpc
```

**Linux/Mac:**
```bash
export DATABASE_URL="postgres://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
npm run deploy:rpc
```

## DATABASE_URL Nasıl Bulunur?

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. Projenizi seçin
3. **Settings** > **Database**'e gidin
4. **Connection string** bölümünde **URI** formatını kopyalayın
5. `[YOUR-PASSWORD]` kısmını database passwordunuzla değiştirin

## Script Ne Yapar?

1. Supabase'e bağlanır
2. Migration dosyasını okur (`supabase/migrations/20260110000000_image_delete_security_fix.sql`)
3. SQL'i çalıştırır
4. Fonksiyonun oluşturulduğunu doğrular

## Başarılı Çıktı

```
=== Supabase RPC Deployment ===

[OK] Supabase'a bağlanıldı
[OK] SQL çalıştırıldı
[OK] Fonksiyon doğrulandı: delete_supplier_image

=== Sonuç ===
[BAŞARILI] RPC fonksiyonu başarıyla oluşturuldu

Fonksiyon artık kullanıma hazır.
Supabase Dashboard > Database Functions üzerinden görebilirsiniz.
```

## Hata Çözümü

### DATABASE_URL Bulunamadı

```
[BAŞARISIZ] DATABASE_URL environment variable bulunamadı
```

**Çözüm:** .env dosyasını kontrol edin veya environment variable set edin.

### Migration Dosyası Bulunamadı

```
[BAŞARISIZ] Migration dosyası bulunamadı: supabase/migrations/...
```

**Çözüm:** Proje kök dizininde olduğunuzdan emin olun.

### Bağlantı Hatası

```
[HATA] password authentication failed
```

**Çözüm:** DATABASE_URL'deki password doğru mu kontrol edin.

## Manuel Deployment

Script çalışmazsa Supabase SQL Editor'da manuel çalıştırın:

1. Supabase Dashboard > SQL Editor
2. `supabase/migrations/20260110000000_image_delete_security_fix.sql` dosyasının içeriğini kopyalayın
3. Run butonuna tıklayın
