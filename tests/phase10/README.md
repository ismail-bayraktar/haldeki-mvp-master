# Phase 10 Import/Export Test Suite

Comprehensive test suite for Phase 10 Excel/CSV import/export system.

## Test Structure

```
tests/phase10/
├── excelParser.test.ts       # Excel file parsing tests
├── csvParser.test.ts         # CSV file parsing tests
├── productValidator.test.ts  # Product data validation tests
├── utils.test.ts             # Utility functions tests
├── importFlow.test.ts        # Import workflow integration tests
├── exportFlow.test.ts        # Export workflow integration tests
├── setup.ts                  # Shared test utilities
└── README.md                 # This file
```

## Running Tests

### Run all Phase 10 tests
```bash
npm test -- tests/phase10
```

### Run specific test file
```bash
npm test -- tests/phase10/excelParser.test.ts
```

### Run with coverage
```bash
npm test -- tests/phase10 --coverage
```

### Watch mode
```bash
npm test -- tests/phase10 --watch
```

## Test Coverage

### Unit Tests

#### 1. Excel Parser (`excelParser.test.ts`)
- ✅ File size validation (max 10MB)
- ✅ File type validation (.xlsx, .xls)
- ✅ Column mapping (Turkish and English)
- ✅ Row parsing with empty row handling
- ✅ Turkish character support (ç, ğ, ı, ö, ş, ü)
- ✅ Number parsing (comma and dot separators)
- ✅ Sheet detection ("Ürünler", "Products", etc.)
- ✅ Error handling and collection

#### 2. CSV Parser (`csvParser.test.ts`)
- ✅ File size validation
- ✅ File type validation (.csv)
- ✅ Delimiter handling (auto-detect, comma, semicolon)
- ✅ Quoted values (commas, newlines, quotes)
- ✅ Turkish character encoding (UTF-8)
- ✅ Column mapping
- ✅ Row parsing
- ✅ Error handling

#### 3. Product Validator (`productValidator.test.ts`)
- ✅ Required field validation (name, category, unit, prices)
- ✅ Price validation (must be > 0)
- ✅ Category validation
- ✅ Unit validation
- ✅ Quality validation
- ✅ Availability validation
- ✅ Image URL validation
- ✅ Turkish character support in all fields
- ✅ Multiple error collection

#### 4. Utils (`utils.test.ts`)
- ✅ Slug generation (Turkish → Latin)
- ✅ Special character removal
- ✅ Case normalization
- ✅ Uniqueness handling
- ✅ Number parsing (Turkish format)
- ✅ Image URL parsing
- ✅ Edge cases (empty, null, very long)

### Integration Tests

#### 5. Import Flow (`importFlow.test.ts`)
- ✅ Complete Excel import workflow
- ✅ Complete CSV import workflow
- ✅ Transaction rollback on failure
- ✅ Audit log creation
- ✅ Partial import handling (some rows fail)
- ✅ Retry logic for transient errors
- ✅ Batch processing for large imports
- ✅ Turkish character handling in full flow

#### 6. Export Flow (`exportFlow.test.ts`)
- ✅ Export to Excel format
- ✅ Export to CSV format
- ✅ Filtering (all, active, inactive)
- ✅ Selected products only
- ✅ Image inclusion/exclusion
- ✅ Turkish character encoding in exports
- ✅ Column mapping and formatting
- ✅ Large dataset handling (1000+ products)

## Test Data

### Valid Product Data
```typescript
{
  name: 'Domates',
  category: 'Sebze',
  unit: 'kg',
  basePrice: 20,
  price: 25,
  stock: 100,
  origin: 'Antalya',
  quality: 'premium',
  availability: 'bol',
  description: 'Taze domates',
  images: ['https://example.com/domates.jpg']
}
```

### Turkish Character Test Cases
- Lowercase: ç, ğ, ı, ö, ş, ü
- Uppercase: Ç, Ğ, İ, Ö, Ş, Ü
- Combinations: "Çilek", "Şeftali", "İncir", "Üzüm", "Örtü altı"

## Key Test Scenarios

### 1. Turkish Language Support
All parsers and validators must handle:
- Turkish characters in product names
- Turkish column headers (Ürün Adı, Kategori, etc.)
- Mixed Turkish/English content
- Proper encoding in CSV (UTF-8)

### 2. Error Handling
Tests verify:
- Individual row errors don't stop entire import
- Multiple errors collected and reported
- Database errors trigger rollback
- User-friendly error messages (Turkish)

### 3. Data Validation
Tests ensure:
- Required fields present and non-empty
- Prices are positive numbers
- URLs are valid
- Turkish characters preserved correctly

### 4. Performance
Tests cover:
- Large files (1000+ rows)
- Batch processing
- Memory efficiency
- Timeout handling

## Mocking Strategy

### XLSX Library
```typescript
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
    json_to_sheet: vi.fn(),
  },
}));
```

### PapaParse Library
```typescript
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));
```

### Supabase Client
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));
```

## Test Patterns

### AAA Pattern
All tests follow Arrange-Act-Assert:

```typescript
it('should parse valid product', () => {
  // Arrange: Set up test data
  const mockData = createMockData();

  // Act: Execute code
  const result = parseProduct(mockData);

  // Assert: Verify outcome
  expect(result.success).toBe(true);
});
```

### Test Naming
Tests use descriptive names:
- `should pass when valid data provided`
- `should reject when required field missing`
- `should handle Turkish characters correctly`

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Phase 10 tests
  run: npm test -- tests/phase10 --coverage
```

### Coverage Thresholds
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Debugging

### Run single test
```bash
npm test -- -t "should parse valid product"
```

### Run with debug output
```bash
npm test -- tests/phase10 --reporter=verbose
```

### Update snapshots
```bash
npm test -- tests/phase10 -u
```

## Future Tests

### Not Yet Implemented
- [ ] E2E tests with actual file uploads
- [ ] Performance benchmarks
- [ ] Memory usage profiling
- [ ] Concurrent import handling
- [ ] Export template generation

## Known Limitations

1. **File Generation**: Tests mock XLSX/PapaParse instead of generating real files
2. **Database**: Tests use mocked Supabase, not real database
3. **Large Files**: No tests for files > 10MB (rejected by validation)

## Contributing

When adding new tests:
1. Follow AAA pattern
2. Use descriptive test names
3. Test Turkish language support
4. Include edge cases
5. Mock external dependencies
6. Add to this README

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Patterns Skill](../../../.claude/skills/testing-patterns/)
- [TDD Workflow Skill](../../../.claude/skills/tdd-workflow/)
- [Phase 10 Requirements](../../../docs/phases/phase-10-import-export.md)
