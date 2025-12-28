-- Eski bekleyen davetleri temizleme scripti
-- Bu script, kullanılmış veya süresi dolmuş davetleri temizler

-- 1. Kullanılmış davetleri sil (used_at IS NOT NULL)
DELETE FROM public.pending_invites
WHERE used_at IS NOT NULL;

-- 2. Süresi dolmuş davetleri sil (expires_at < NOW())
DELETE FROM public.pending_invites
WHERE expires_at < NOW();

-- 3. Kayıtlı kullanıcılara ait davetleri sil
-- (dealers veya suppliers tablosunda user_id ile eşleşen email'ler)
DELETE FROM public.pending_invites pi
WHERE EXISTS (
  SELECT 1
  FROM public.dealers d
  WHERE d.contact_email = pi.email
    AND d.user_id IS NOT NULL
    AND pi.role = 'dealer'
)
OR EXISTS (
  SELECT 1
  FROM public.suppliers s
  WHERE s.contact_email = pi.email
    AND s.user_id IS NOT NULL
    AND pi.role = 'supplier'
);

-- Sonuçları göster
SELECT 
  role,
  COUNT(*) as remaining_count
FROM public.pending_invites
GROUP BY role;

