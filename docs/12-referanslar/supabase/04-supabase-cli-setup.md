# Supabase CLI Kurulumu ve Kullanımı

> Bu rehber, Supabase CLI'yi kurma ve migration'ları çalıştırma konusunda adım adım talimatlar içerir.

---

## Kurulum

### ⚠️ Önemli Not

Supabase CLI **npm global kurulumunu desteklemez**. Aşağıdaki yöntemlerden birini kullanın:

### Yöntem 1: npx ile Kullanım (Önerilen - Kurulum Gerektirmez)

```bash
npx supabase --version
```

**Avantaj**: Kurulum gerektirmez, her zaman güncel versiyonu kullanır.

**Kullanım**: Her komutta `npx` öneki gerekir:
```bash
npx supabase db push
npx supabase login
```

### Yöntem 2: Scoop ile Kurulum (Windows)

```powershell
# Scoop kurulu değilse önce Scoop'u kurun
# https://scoop.sh

scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Yöntem 3: Chocolatey ile Kurulum (Windows)

```powershell
choco install supabase
```

### Yöntem 4: Winget ile Kurulum (Windows)

```powershell
winget install Supabase.CLI
```

---

## İlk Kurulum

### 1. Supabase'e Giriş Yap

```bash
supabase login
```

veya

```bash
npx supabase login
```

Bu komut browser'ı açacak ve Supabase hesabınıza giriş yapmanızı isteyecek.

### 2. Projeyi Bağla

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` değerini Supabase Dashboard'dan alabilirsiniz:
- Dashboard → Settings → General → Reference ID

veya `.env.local` dosyasındaki URL'den:
```
https://YOUR_PROJECT_REF.supabase.co
```

---

## Migration İşlemleri

### Migration'ları Push Et

```bash
supabase db push
```

veya

```bash
npx supabase db push
```

Bu komut:
- Yeni migration dosyalarını kontrol eder
- Remote database'e uygular
- Onay ister (Y/n)

### Migration'ları Pull Et (Remote → Local)

```bash
supabase db pull
```

### Migration Geçmişini Görüntüle

```bash
supabase migration list
```

---

## Storage Bucket İşlemleri

### Bucket Oluştur

Supabase Dashboard'dan:
1. Storage → New bucket
2. Bucket adı: `receipts` (veya istediğiniz isim)
3. Public bucket: **KAPALI** (güvenlik için)
4. Create

### Bucket Politikaları

RLS politikaları migration'larda tanımlanmalı veya Dashboard'dan manuel eklenebilir.

---

## Hızlı Komutlar

| Komut | Açıklama |
|-------|----------|
| `supabase login` | Supabase'e giriş yap |
| `supabase link --project-ref XXX` | Projeyi bağla |
| `supabase db push` | Migration'ları push et |
| `supabase db pull` | Remote'dan migration çek |
| `supabase migration list` | Migration listesi |
| `supabase --version` | CLI versiyonu |

---

## Sorun Giderme

### "supabase: command not found"

**Çözüm 1**: Global kurulum yapın:
```bash
npm install -g supabase
```

**Çözüm 2**: npx kullanın:
```bash
npx supabase [komut]
```

### "Not logged in"

**Çözüm**:
```bash
supabase login
```

### "Project not linked"

**Çözüm**:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Migration Hatası: "function has_role does not exist"

**Çözüm**: Migration dosyasında `has_role` fonksiyonunu doğru şekilde çağırın:
```sql
-- ❌ Yanlış
has_role('admin')

-- ✅ Doğru
has_role(auth.uid(), 'admin'::public.app_role)
```

---

## Önerilen Workflow

1. **Yeni Migration Oluştur**:
   ```bash
   supabase migration new migration_name
   ```

2. **Migration Dosyasını Düzenle**:
   - `supabase/migrations/` klasöründeki dosyayı düzenle

3. **Test Et** (Local):
   ```bash
   supabase start  # Local Supabase başlat
   supabase db reset  # Local DB'yi sıfırla ve migration'ları uygula
   ```

4. **Production'a Push Et**:
   ```bash
   supabase db push
   ```

---

## Environment Variables

Supabase CLI otomatik olarak `.env.local` dosyasını okur, ancak bazı durumlarda manuel olarak ayarlamak gerekebilir:

```bash
export SUPABASE_ACCESS_TOKEN=your_token
export SUPABASE_DB_PASSWORD=your_password
```

---

Son güncelleme: 2025-12-28

