# Dokümantasyon Eşitleme Sistemi

> Kod ve dokümantasyon arasında otomatik senkronizasyon sağlayan sistem.

## Genel Bakış

Bu proje, dokümantasyonun kod ile senkronize kalmasını sağlamak için basit bir sistem kullanır:

1. **JSDoc Yorumları** - Kod içindeki yorumlardan API dokümantasyonu oluşturur
2. **Otomatik İndeks** - Tüm dokümanları tarayan aranabilir bir dizin oluşturur
3. **TypeDoc** - TypeScript tip bilgilerinden HTML dokümantasyon üretir (opsiyonel)

> **Not**: TypeDoc, TypeScript hataları içerdiğinde çalışmaz. Bu durumda `npm run docs:generate` kullanın.

## Kurulum

```bash
# TypeDoc zaten yüklü (devDependencies)
npm install
```

## Kullanım

### Dokümantasyon Oluştur

```bash
# Sadece indeks ve ağaç oluştur (önerilen)
npm run docs:generate

# API dokümantasyonunu oluştur (HTML - TypeScript hatasız olmalı)
npm run docs:api

# API dokümantasyonunu oluştur (JSON - TypeScript hatasız olmalı)
npm run docs:api:json

# Hepsi bir arada (TypeScript hatasız ise)
npm run docs:build
```

### Geliştirme Modu

```bash
# Dosya değişikliklerini izle ve dokümantasyonu güncelle
npm run docs:watch
```

## Yapı

```
docs/
├── INDEX.md                 # Otomatik oluşturulan ana indeks
├── TREE.md                  # Dokümantasyon yapısı (ASCII tree)
├── README.md                # Manuel dokümantasyon
├── api/                     # JSDoc'tan oluşturulan API dokümanları
│   └── index.md            # API fonksiyonları özeti
└── api-reference/           # TypeDoc HTML çıktısı
    └── index.html          # Ana API referans sayfası
```

## JSDoc Yazma Kuralları

### Temel Şablon

```typescript
/**
 * Kısa açıklama (bir satır).
 *
 * Uzun açıklama (isteğe bağlı).
 *
 * @param paramName - Parametre açıklaması
 * @returns Dönüş değeri açıklaması
 * @throws {ErrorType} Hata durumu açıklaması
 *
 * @example
 * ```typescript
 * const result = functionName(input);
 * console.log(result);
 * ```
 */
export function functionName(paramName: string): ReturnType {
  // implementation
}
```

### Bileşen Dokümantasyonu

```typescript
/**
 * Ürün kartı bileşeni.
 *
 * Ürün bilgilerini görüntüler ve sepete eklemeye izin verir.
 *
 * @component
 * @example
 * ```tsx
 * <ProductCard
 *   product={productData}
 *   onAddToCart={(id) => console.log(id)}
 * />
 * ```
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // implementation
}
```

### Hook Dokümantasyonu

```typescript
/**
 * Ürün verilerini getiren özel hook.
 *
 * @param regionId - Bölge ID'si (opsiyonel)
 * @returns {QueryResult} Ürünler ve yükleme durumu
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useProducts('region-123');
 * ```
 */
export function useProducts(regionId?: string) {
  // implementation
}
```

## Pre-Commit Hook (Opsiyonel)

Otomatik dokümantasyon güncellemesi için pre-commit hook'u kullanabilirsiniz:

```bash
# Hook'u .git/hooks/pre-commit olarak kopyala
cp scripts/hooks/pre-commit .git/hooks/pre-commit

# Çalıştırılabilir yap
chmod +x .git/hooks/pre-commit
```

Bypass için:
```bash
git commit --no-verify -m "message"
```

## Dokümantasyon İlkeleri

### Ne Dokümante Edilmeli

| Dokümante Etme | Dokümante Etme |
|----------------|----------------|
| Neden (iş mantığı) | Neyi (açık kod) |
| Karmaşık algoritmalar | Her satır |
| Beklenmeyen davranışlar | Kendini açıklayan kod |
| API sözleşmeleri | Implementasyon detayları |

### Kalite Kontrol Listesi

- [ ] Yeni başlayanlar 5 dakikada başlayabilir mi?
- [ ] Örnekler çalışır ve test edilmiş mi?
- [ ] Dokümantasyon güncel mi?
- [ ] Yapı taranabilir mi?
- [ ] Kenar durumları dokümante edilmiş mi?

## Dosya İsimlendirme

- **Kebap-case kullan**: `dealer-supplier-flow.md`
- **Faz dokümanları**: `phase-X-isim.md`
- **Rehberler numaralandırılır**: `01-supabase-migration.md`

## Türkçe Dokümantasyon Standartları

1. Tüm dokümanlar Türkçe yazılır
2. Markdown formatı kullanılır
3. Mermaid diyagramları tercih edilir
4. Her doküman "Son güncelleme" tarihi içerir

## Otomatik Oluşturulan Dosyalar

Aşağıdaki dosyalar otomatik oluşturulur ve manuel düzenlemesi önerilmez:

- `docs/INDEX.md` - Ana indeks
- `docs/TREE.md` - Yapı ağacı
- `docs/api/index.md` - API özeti
- `docs/api-reference/` - TypeDoc çıktısı

## Sorun Giderme

### TypeDoc Hataları

```bash
# tsconfig.app.json dosyasını kontrol et
cat tsconfig.app.json

# TypeDoc yapılandırmasını kontrol et
cat typedoc.config.js
```

### JSDoc Gözükmüyor

- JSDoc yorumunun `/** ... */` formatında olduğunu kontrol et
- `export` keyword'ünün kullanıldığından emin ol
- TypeScript dosyasının `.ts` veya `.tsx` uzantısına sahip olduğunu kontrol et

## İlgili Kaynaklar

- [JSDoc Resmi Dokümantasyon](https://jsdoc.app/)
- [TypeDoc Dokümantasyonu](https://typedoc.org/)
- [Markdown Rehberi](https://www.markdownguide.org/)
- [Mermaid Diyagramları](https://mermaid.js.org/)

---

Son güncelleme: 2025-01-04
