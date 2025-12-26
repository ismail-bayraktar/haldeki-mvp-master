-- Migration-1: Enum Extension (Ayrı Transaction)
-- app_role enum'a yeni değerler ekliyoruz

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supplier';