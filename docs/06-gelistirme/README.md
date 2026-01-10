# 06. Geliştirme

> Geliştirici rehberleri ve kod standartları

---

## Bu Klasör

Geliştiriciler için çalışma standartları, workflow ve debugging rehberleri.

---

## İçindekiler

| Dosya | Konu | Hedef Kitle |
|-------|------|-------------|
| [kod-standartlari.md](./kod-standartlari.md) | TypeScript ve React standartları | Tüm geliştiriciler |
| [git-workflow.md](./git-workflow.md) | Branch ve commit kuralları | Tüm geliştiriciler |
| [debugging.md](./debugging.md) | Common sorunlar ve çözümler | Geliştiriciler |
| [code-review.md](./code-review.md) | Code review checklist | Senior+ |

---

## Kod Standartları Özeti

### TypeScript Kuralları

```typescript
// ✅ DOĞRU
interface Product {
  id: string;
  name: string;
  price: number;
}

async function getProduct(id: string): Promise<Product | null> {
  // ...
}

// ❌ YANLIŞ
function getProduct(id) {  // Tip yok
  // ...
}
```

### React Kuralları

```typescript
// ✅ DOĞRU
function ProductList({ products }: ProductListProps) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(
    () => products.filter(p => p.name.includes(filter)),
    [products, filter]
  );

  return <div>{/* ... */}</div>;
}

// ❌ YANLIŞ
function ProductList(props) {  // Tip yok, props destructuring yok
  const filtered = products.filter(/* her render'da hesaplanır */);
  return <div>{/* ... */}</div>;
}
```

---

## Git Workflow

```bash
main
├── feature/phase-12-multi-supplier
├── fix/supplier-auth-error
├── refactor/product-catalog
└── docs/update-readme
```

**Branch kuralları:**
- `feature/*` - Yeni özellik
- `fix/*` - Bug fix
- `refactor/*` - Refactoring
- `docs/*` - Dokümantasyon

**Commit format:**
```
type(scope): description

feat(supplier): add product matching algorithm
fix(auth): resolve login redirect loop
docs(readme): update installation steps
```

---

## İlgili Dokümanlar

- [Test Stratejisi](../07-test/test-stratejisi.md)
- [CI/CD Pipeline](../08-deployment/ci-cd.md)

---

**Son güncelleme:** 2026-01-10
