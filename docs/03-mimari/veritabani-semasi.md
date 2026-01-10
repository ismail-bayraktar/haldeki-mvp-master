# Veritabanı Şeması

> Bu doküman Haldeki veritabanı yapısını, ilişkileri ve veri modelini açıklar.

## ER Diyagramı

```mermaid
erDiagram
    AUTH_USERS ||--o{ USER_ROLES : has
    AUTH_USERS ||--o| PROFILES : has
    AUTH_USERS ||--o| DEALERS : becomes
    AUTH_USERS ||--o| SUPPLIERS : becomes
    AUTH_USERS ||--o{ ORDERS : places
    AUTH_USERS ||--o{ PENDING_INVITES : invited_by

    REGIONS ||--o{ REGION_PRODUCTS : contains
    REGIONS ||--o{ ORDERS : delivers_to

    PRODUCTS ||--o{ REGION_PRODUCTS : priced_in

    DEALERS ||--o{ ORDERS : fulfills

    SUPPLIERS ||--o{ SUPPLIER_OFFERS : submits
    SUPPLIERS ||--o{ PRODUCT_IMPORTS : imports

    AUTH_USERS ||--o| BUSINESSES : becomes

    REGIONS {
        uuid id PK
        text name
        text slug UK
        boolean is_active
        jsonb delivery_slots
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        text name
        text slug UK
        text description
        text category
        product_unit unit
        numeric base_price
        text image_url
        boolean is_bugun_halde
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    REGION_PRODUCTS {
        uuid id PK
        uuid region_id FK
        uuid product_id FK
        numeric price
        numeric business_price
        integer stock
        quality_grade quality_grade
        availability_status availability_status
        price_change price_change
        boolean is_available
        timestamp created_at
        timestamp updated_at
    }

    BUSINESSES {
        uuid id PK
        uuid user_id FK_UK
        text company_name
        text contact_name
        text contact_phone
        text contact_email
        text business_type
        text tax_number
        uuid_array region_ids
        approval_status approval_status
        timestamp created_at
        timestamp updated_at
    }
    
    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid region_id FK
        uuid dealer_id FK
        text status
        numeric total_amount
        jsonb shipping_address
        jsonb delivery_slot
        jsonb items
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    PROFILES {
        uuid id PK_FK
        text email
        text full_name
        text phone
        text avatar_url
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp created_at
    }
    
    PENDING_INVITES {
        uuid id PK
        text email UK
        app_role role
        uuid invited_by FK
        jsonb dealer_data
        jsonb supplier_data
        timestamp expires_at
        timestamp used_at
        timestamp created_at
    }
    
    DEALERS {
        uuid id PK
        uuid user_id FK_UK
        text name
        text contact_name
        text contact_phone
        text contact_email
        uuid_array region_ids
        text tax_number
        approval_status approval_status
        text approval_notes
        timestamp approved_at
        uuid approved_by FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    SUPPLIERS {
        uuid id PK
        uuid user_id FK_UK
        text name
        text contact_name
        text contact_phone
        text contact_email
        text_array product_categories
        approval_status approval_status
        text approval_notes
        timestamp approved_at
        uuid approved_by FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    SUPPLIER_OFFERS {
        uuid id PK
        uuid supplier_id FK
        text product_name
        text category
        product_unit unit
        numeric quantity
        numeric unit_price
        quality_grade quality_grade
        text notes
        text status
        text admin_notes
        timestamp valid_until
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_IMPORTS {
        uuid id PK
        uuid supplier_id FK
        text file_name
        integer file_size
        integer total_rows
        integer successful_rows
        integer failed_rows
        jsonb errors
        text status
        timestamp created_at
        timestamp completed_at
    }
```

---

## Tablolar

### Core Tablolar

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profil bilgileri (auth.users ile 1:1) |
| `user_roles` | Kullanıcı rolleri (multi-role destekli) |
| `regions` | Teslimat bölgeleri ve slot bilgileri |
| `products` | Ana ürün kataloğu |
| `region_products` | Bölgeye özel fiyat/stok bilgileri |
| `orders` | Müşteri siparişleri |

### Role-Specific Tablolar

| Tablo | Açıklama |
|-------|----------|
| `pending_invites` | Bayi/Tedarikçi davet sistemi |
| `dealers` | Bayi bilgileri ve onay durumu |
| `suppliers` | Tedarikçi bilgileri ve onay durumu |
| `businesses` | İşletme (B2B) bilgileri ve onay durumu |
| `supplier_offers` | Tedarikçi ürün teklifleri |
| `product_imports` | Tedarikçi ürün içe aktarma kayıtları (audit log) |

---

## Enum Tipleri

### app_role

```sql
'user'       -- Standart müşteri
'admin'      -- Sistem yöneticisi
'superadmin' -- Süper yönetici (admin yetkilerini kapsar)
'dealer'     -- Bölge bayisi
'supplier'   -- Tedarikçi
'business'   -- İşletme (B2B)
```

### approval_status

```sql
'pending'   -- Onay bekliyor
'approved'  -- Onaylandı
'rejected'  -- Reddedildi
```

### product_unit

```sql
'kg'     -- Kilogram
'adet'   -- Adet
'demet'  -- Demet
'paket'  -- Paket
```

### quality_grade

```sql
'premium'   -- Premium kalite
'standart'  -- Standart kalite
'ekonomik'  -- Ekonomik kalite
```

### availability_status

```sql
'plenty'  -- Bol stok
'limited' -- Sınırlı stok
'last'    -- Son ürünler
```

### price_change

```sql
'up'     -- Fiyat arttı
'down'   -- Fiyat düştü
'stable' -- Fiyat sabit
```

---

## JSONB Yapıları

### delivery_slots (regions tablosu)

```json
[
  {
    "day": "Pazartesi",
    "time_slots": ["09:00-12:00", "14:00-18:00"]
  },
  {
    "day": "Çarşamba",
    "time_slots": ["09:00-12:00", "14:00-18:00"]
  }
]
```

### shipping_address (orders tablosu)

```json
{
  "full_name": "Ahmet Yılmaz",
  "phone": "0532 123 45 67",
  "address": "Atatürk Mah. 123 Sok. No:5",
  "city": "İzmir",
  "district": "Menemen",
  "notes": "Kapıda ödeme"
}
```

### items (orders tablosu)

```json
[
  {
    "product_id": "uuid",
    "product_name": "Domates",
    "quantity": 2,
    "unit": "kg",
    "unit_price": 25.00,
    "total_price": 50.00
  }
]
```

### dealer_data (pending_invites tablosu)

```json
{
  "name": "ABC Ticaret",
  "contact_name": "Mehmet Demir",
  "contact_phone": "0532 111 22 33",
  "contact_email": "info@abc.com",
  "region_ids": ["uuid1", "uuid2"],
  "tax_number": "1234567890"
}
```

### supplier_data (pending_invites tablosu)

```json
{
  "name": "XYZ Çiftliği",
  "contact_name": "Ali Kaya",
  "contact_phone": "0533 444 55 66",
  "contact_email": "ali@xyz.com",
  "product_categories": ["sebze", "meyve"]
}
```

---

## İndeksler

| Tablo | İndeks | Amaç |
|-------|--------|------|
| regions | `idx_regions_slug` | Slug ile hızlı arama |
| regions | `idx_regions_is_active` | Aktif bölgeleri filtreleme |
| products | `idx_products_slug` | Slug ile hızlı arama |
| products | `idx_products_category` | Kategori filtreleme |
| products | `idx_products_is_active` | Aktif ürünleri filtreleme |
| products | `idx_products_is_bugun_halde` | Bugün Halde ürünlerini filtreleme |
| region_products | `idx_region_products_region` | Bölge bazlı sorgular |
| region_products | `idx_region_products_product` | Ürün bazlı sorgular |
| orders | `idx_orders_user` | Kullanıcı siparişleri |
| orders | `idx_orders_region` | Bölge bazlı siparişler |
| orders | `idx_orders_status` | Durum filtreleme |
| dealers | `idx_dealers_approval_status` | Onay durumu filtreleme |
| suppliers | `idx_suppliers_approval_status` | Onay durumu filtreleme |
| product_imports | `idx_product_imports_supplier` | Tedarikçi import geçmişi |
| product_imports | `idx_product_imports_status` | Durum filtreleme |
| product_imports | `idx_product_imports_created_at` | Tarihe göre sıralama |

---

## Unique Constraints

| Tablo | Constraint | Açıklama |
|-------|-----------|----------|
| regions | `slug` | Bölge slug'ları benzersiz |
| products | `slug` | Ürün slug'ları benzersiz |
| region_products | `(region_id, product_id)` | Bir ürün bir bölgede tek kayıt |
| user_roles | `(user_id, role)` | Kullanıcı-rol kombinasyonu benzersiz |
| pending_invites | `(email, role)` | Aynı email-rol için tek davet |
| dealers | `user_id` | Bir kullanıcı tek bayi olabilir |
| suppliers | `user_id` | Bir kullanıcı tek tedarikçi olabilir |

---

## Foreign Key İlişkileri

```
profiles.id         → auth.users.id (CASCADE)
user_roles.user_id  → auth.users.id (CASCADE)
orders.user_id      → auth.users.id (SET NULL)
orders.region_id    → regions.id (SET NULL)
region_products.region_id  → regions.id (CASCADE)
region_products.product_id → products.id (CASCADE)
pending_invites.invited_by → auth.users.id (SET NULL)
dealers.user_id     → auth.users.id (SET NULL)
dealers.approved_by → auth.users.id
suppliers.user_id   → auth.users.id (SET NULL)
suppliers.approved_by → auth.users.id
supplier_offers.supplier_id → suppliers.id (CASCADE)
```

---

## Trigger'lar

| Trigger | Tablo | Açıklama |
|---------|-------|----------|
| `on_auth_user_created` | auth.users | Yeni kullanıcı → profil + rol oluştur |
| `profiles_updated_at` | profiles | updated_at güncelle |
| `regions_updated_at` | regions | updated_at güncelle |
| `products_updated_at` | products | updated_at güncelle |
| `region_products_updated_at` | region_products | updated_at güncelle |
| `orders_updated_at` | orders | updated_at güncelle |
| `dealers_updated_at` | dealers | updated_at güncelle |
| `suppliers_updated_at` | suppliers | updated_at güncelle |
| `supplier_offers_updated_at` | supplier_offers | updated_at güncelle |

---

## Önemli Fonksiyonlar

### has_role(user_id, role)

```sql
-- Kullanıcının belirtilen role sahip olup olmadığını kontrol eder
-- Superadmin için 'admin' kontrolü de true döner
SELECT has_role(auth.uid(), 'admin'::app_role);
```

### handle_new_user()

```sql
-- auth.users'a yeni kayıt eklendiğinde tetiklenir
-- 1. profiles tablosuna kayıt ekler
-- 2. pending_invites'da davet varsa:
--    - İlgili rolü atar
--    - dealers/suppliers tablosuna kayıt ekler
--    - Daveti kullanıldı olarak işaretler
-- 3. Davet yoksa 'user' rolü atar
```

---

Son güncelleme: 2026-01-07

