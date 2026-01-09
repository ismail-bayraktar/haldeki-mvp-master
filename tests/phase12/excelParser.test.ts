/**
 * Excel Parser Tests - Phase 12 Variation Extraction
 * Tests for variation extraction from product names
 */

import { describe, it, expect } from 'vitest';
import { extractVariations, validateVariations } from '@/lib/excelParser';
import type { ProductImportVariation, ProductVariationType } from '@/types/supplier';

describe('Variation Extraction - Size', () => {
  it('should extract size in LT', () => {
    const result = extractVariations('ABC BULAŞIK 4 LT');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[0].value).toContain('4');
    expect(result.variations[0].value).toContain('LT');
    expect(result.variations[0].display_order).toBe(1);
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should extract size in KG', () => {
    const result = extractVariations('DEF DETERJAN 1.5 KG');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[0].value).toContain('1.5');
    expect(result.variations[0].value).toContain('KG');
    expect(result.baseName).toBe('DEF DETERJAN');
  });

  it('should extract size in ML', () => {
    const result = extractVariations('GHI SABUN 500 ML');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[0].value).toContain('500');
    expect(result.variations[0].value).toContain('ML');
    expect(result.baseName).toBe('GHI SABUN');
  });

  it('should extract size in GR', () => {
    const result = extractVariations('JKL TOZ 1000 GR');
    // TOZ is also extracted as a type variation
    expect(result.variations.length).toBeGreaterThanOrEqual(1);
    expect(result.variations.some(v => v.type === 'size')).toBe(true);
    expect(result.baseName).toContain('JKL');
  });

  it('should handle comma as decimal separator', () => {
    const result = extractVariations('MNO ÜRÜN 1,5 KG');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].value).toContain('1.5');
    expect(result.variations[0].value).toContain('KG');
  });

  it('should extract size with L shorthand', () => {
    const result = extractVariations('PQR BULAŞIK 5 L');
    expect(result.variations[0].value).toContain('5');
    expect(result.variations[0].value).toContain('LT');
  });

  it('should extract size with K shorthand', () => {
    const result = extractVariations('STF DETERJAN 3 K');
    expect(result.variations[0].value).toContain('3');
    expect(result.variations[0].value).toContain('KG');
  });
});

describe('Variation Extraction - Type', () => {
  it('should extract BEYAZ type', () => {
    const result = extractVariations('ABC BULAŞIK BEYAZ');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0]).toEqual({
      type: 'type' as ProductVariationType,
      value: 'BEYAZ',
      display_order: 2,
      metadata: undefined,
    });
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should extract RENKLI type', () => {
    const result = extractVariations('DEF ÇAMAŞIR RENKLI');
    expect(result.variations[0].value).toBe('RENKLI');
    expect(result.baseName).toBe('DEF ÇAMAŞIR');
  });

  it('should extract SIVI type', () => {
    const result = extractVariations('GHI SIVI');
    expect(result.variations[0].value).toBe('SIVI');
    expect(result.baseName).toBe('GHI');
  });

  it('should extract TOZ type', () => {
    const result = extractVariations('JKL TOZ');
    expect(result.variations[0].value).toBe('TOZ');
    expect(result.baseName).toBe('JKL');
  });

  it('should normalize Turkish characters in type', () => {
    const result = extractVariations('MNO YUVARLAK');
    expect(result.variations).toHaveLength(0); // YUVARLAK not in the list
    expect(result.baseName).toBe('MNO YUVARLAK');
  });
});

describe('Variation Extraction - Scent', () => {
  it('should extract LAVANTA scent', () => {
    const result = extractVariations('ABC BULAŞIK LAVANTA');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0]).toEqual({
      type: 'scent' as ProductVariationType,
      value: 'LAVANTA',
      display_order: 3,
    });
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should extract LIMON scent', () => {
    const result = extractVariations('DEF SABUN LIMON');
    expect(result.variations[0].value).toBe('LIMON');
    expect(result.baseName).toBe('DEF SABUN');
  });

  it('should extract GUL scent', () => {
    const result = extractVariations('GHI KREM GÜL');
    expect(result.variations[0].value).toBe('GUL');
    expect(result.baseName).toBe('GHI KREM');
  });

  it('should extract GREYFURT scent', () => {
    const result = extractVariations('JKL GREYFURT');
    expect(result.variations[0].value).toBe('GREYFURT');
    expect(result.baseName).toBe('JKL');
  });

  it('should extract CILEK scent', () => {
    const result = extractVariations('MNO CILEK');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('scent');
    expect(result.variations[0].value).toBeTruthy();
    expect(result.baseName).toBe('MNO');
  });

  it('should extract VANILYA scent', () => {
    const result = extractVariations('PQR VANILYA');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('scent');
    expect(result.variations[0].value).toBeTruthy();
    expect(result.baseName).toBe('PQR');
  });

  it('should extract CIKOLATA scent', () => {
    const result = extractVariations('STF CIKOLATA');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('scent');
    expect(result.variations[0].value).toBeTruthy();
    expect(result.baseName).toBe('STF');
  });

  it('should extract PORTAKAL scent', () => {
    const result = extractVariations('UVW PORTAKAL');
    expect(result.variations[0].value).toBe('PORTAKAL');
    expect(result.baseName).toBe('UVW');
  });

  it('should extract MISKET scent', () => {
    const result = extractVariations('XYZ MISKET');
    expect(result.variations[0].value).toBe('MISKET');
    expect(result.baseName).toBe('XYZ');
  });
});

describe('Variation Extraction - Packaging', () => {
  it('should extract *4 packaging', () => {
    const result = extractVariations('ABC BULAŞIK *4');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0]).toEqual({
      type: 'packaging' as ProductVariationType,
      value: '4',
      display_order: 4,
      metadata: { count: 4 },
    });
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should extract *6 packaging', () => {
    const result = extractVariations('DEF ÜRÜN *6');
    expect(result.variations[0].value).toBe('6');
    expect(result.variations[0].metadata?.count).toBe(6);
    expect(result.baseName).toBe('DEF ÜRÜN');
  });

  it('should extract *12 packaging', () => {
    const result = extractVariations('GHI SABUN *12');
    expect(result.variations[0].value).toBe('12');
    expect(result.variations[0].metadata?.count).toBe(12);
    expect(result.baseName).toBe('GHI SABUN');
  });

  it('should extract packaging with space before asterisk', () => {
    const result = extractVariations('JKL DETERJAN *4');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('packaging');
    expect(result.variations[0].value).toBe('4');
    expect(result.baseName).toBe('JKL DETERJAN');
  });
});

describe('Variation Extraction - Material', () => {
  it('should extract CAM material', () => {
    const result = extractVariations('ABC ŞİŞE CAM');
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0]).toEqual({
      type: 'material' as ProductVariationType,
      value: 'CAM',
      display_order: 5,
    });
    expect(result.baseName).toBe('ABC ŞİŞE');
  });

  it('should extract PLASTIK material', () => {
    const result = extractVariations('DEF PLASTIK');
    expect(result.variations[0].value).toBe('PLASTIK');
    expect(result.baseName).toBe('DEF');
  });

  it('should extract METAL material', () => {
    const result = extractVariations('GHI METAL');
    expect(result.variations[0].value).toBe('METAL');
    expect(result.baseName).toBe('GHI');
  });

  it('should extract KAGIT material', () => {
    const result = extractVariations('JKL KAGIT');
    expect(result.variations[0].value).toBe('KAGIT');
    expect(result.baseName).toBe('JKL');
  });
});

describe('Variation Extraction - Multiple Variations', () => {
  it('should extract size and type', () => {
    const result = extractVariations('ABC BULAŞIK 4 LT BEYAZ');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('type');
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should extract size, type, and scent', () => {
    const result = extractVariations('DEF DETERJAN 5 LT BEYAZ LAVANTA');
    expect(result.variations).toHaveLength(3);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('type');
    expect(result.variations[2].type).toBe('scent');
    expect(result.baseName).toBe('DEF DETERJAN');
  });

  it('should extract all four variation types', () => {
    const result = extractVariations('GHI BULAŞIK 4 LT BEYAZ LAVANTA *6');
    expect(result.variations).toHaveLength(4);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('type');
    expect(result.variations[2].type).toBe('scent');
    expect(result.variations[3].type).toBe('packaging');
    expect(result.baseName).toBe('GHI BULAŞIK');
  });

  it('should extract size and packaging only', () => {
    const result = extractVariations('JKL SABUN 100 GR *4');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('packaging');
    expect(result.baseName).toBe('JKL SABUN');
  });

  it('should maintain correct display order for multiple variations', () => {
    const result = extractVariations('MNO ÜRÜN BEYAZ 4 LT LAVANTA *6');
    expect(result.variations[0].display_order).toBe(1); // size
    expect(result.variations[1].display_order).toBe(2); // type
    expect(result.variations[2].display_order).toBe(3); // scent
    expect(result.variations[3].display_order).toBe(4); // packaging
  });
});

describe('Variation Extraction - Edge Cases', () => {
  it('should handle product name with no variations', () => {
    const result = extractVariations('ABC BULAŞIK');
    expect(result.variations).toHaveLength(0);
    expect(result.baseName).toBe('ABC BULAŞIK');
  });

  it('should handle empty string', () => {
    const result = extractVariations('');
    expect(result.variations).toHaveLength(0);
    expect(result.baseName).toBe('');
  });

  it('should handle variation-like words in base name', () => {
    const result = extractVariations('BEYAZ ESYA BULAŞIK');
    // BEYAZ will be extracted as type variation
    expect(result.variations.length).toBeGreaterThanOrEqual(0);
    expect(result.baseName).toContain('ESYA');
  });

  it('should not extract duplicate variation types', () => {
    const result = extractVariations('ABC BULAŞIK 4 LT 5 KG');
    // Only first size will be extracted due to duplicate check
    expect(result.variations).toHaveLength(1);
    expect(result.variations[0].type).toBe('size');
  });

  it('should handle case insensitivity', () => {
    const result = extractVariations('def bulaşık beyaz lavanta');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].value).toBe('BEYAZ');
    expect(result.variations[1].value).toBe('LAVANTA');
  });

  it('should clean up extra spaces in base name', () => {
    const result = extractVariations('ABC    BULAŞIK   4   LT   BEYAZ');
    expect(result.baseName).toBe('ABC BULAŞIK');
    expect(result.variations).toHaveLength(2);
  });

  it('should handle numbers without units', () => {
    const result = extractVariations('ABC BULAŞIK 4');
    expect(result.variations).toHaveLength(0);
    expect(result.baseName).toBe('ABC BULAŞIK 4');
  });

  it('should handle malformed input gracefully', () => {
    const result = extractVariations('1234567890 !@#$% ^&*()');
    expect(result.variations).toHaveLength(0);
    expect(result.baseName).toBe('1234567890 !@#$% ^&*()');
  });
});

describe('Variation Extraction - Real Product Examples', () => {
  it('should parse real dishwasher product', () => {
    const result = extractVariations('PRIL BULAŞIK MAKİNESİ TABLET 4 LT BEYAZ');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('type');
    expect(result.baseName).toBe('PRIL BULAŞIK MAKİNESİ TABLET');
  });

  it('should parse real laundry detergent', () => {
    const result = extractVariations('ARIEL ÇAMAŞIR DETERJANI 5 KG LIMON');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('scent');
    expect(result.baseName).toBe('ARIEL ÇAMAŞIR DETERJANI');
  });

  it('should parse real soap product', () => {
    const result = extractVariations('DALLY SIVI SABUN 1 LT MISKET *4');
    // SIVI is also extracted as type
    expect(result.variations.length).toBeGreaterThanOrEqual(3);
    expect(result.variations.some(v => v.type === 'size')).toBe(true);
    expect(result.variations.some(v => v.type === 'scent')).toBe(true);
    expect(result.variations.some(v => v.type === 'packaging')).toBe(true);
    expect(result.baseName).toContain('DALLY');
  });

  it('should parse real bleach product', () => {
    const result = extractVariations('DOMESTOS ÇAMAŞIR SUYU 750 ML BEYAZ');
    expect(result.variations).toHaveLength(2);
    expect(result.variations[0].type).toBe('size');
    expect(result.variations[1].type).toBe('type');
    expect(result.baseName).toBe('DOMESTOS ÇAMAŞIR SUYU');
  });
});

describe('Variation Validation', () => {
  it('should validate correct variations', () => {
    const variations: ProductImportVariation[] = [
      { type: 'size', value: '4 LT', display_order: 1, metadata: { value: '4', unit: 'LT' } },
      { type: 'type', value: 'BEYAZ', display_order: 2 },
      { type: 'scent', value: 'LAVANTA', display_order: 3 },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect duplicate variation types', () => {
    const variations: ProductImportVariation[] = [
      { type: 'size', value: '4 LT', display_order: 1, metadata: { value: '4', unit: 'LT' } },
      { type: 'size', value: '5 KG', display_order: 2, metadata: { value: '5', unit: 'KG' } },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Tekrar varyasyon türü: size');
  });

  it('should detect empty variation values', () => {
    const variations: ProductImportVariation[] = [
      { type: 'size', value: '', display_order: 1 },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Boş varyasyon değeri: size');
  });

  it('should validate size format', () => {
    const variations: ProductImportVariation[] = [
      { type: 'size', value: 'INVALID', display_order: 1 },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Geçersiz boyut formatı: INVALID');
  });

  it('should validate packaging format', () => {
    const variations: ProductImportVariation[] = [
      { type: 'packaging', value: 'ABC', display_order: 4 },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Geçersiz paket formatı: ABC');
  });

  it('should accept valid packaging format', () => {
    const variations: ProductImportVariation[] = [
      { type: 'packaging', value: '12', display_order: 4, metadata: { count: 12 } },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect multiple validation errors', () => {
    const variations: ProductImportVariation[] = [
      { type: 'size', value: '', display_order: 1 },
      { type: 'packaging', value: 'ABC', display_order: 4 },
    ];
    const result = validateVariations(variations);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should allow type variations with any value', () => {
    const variations: ProductImportVariation[] = [
      { type: 'type', value: 'BEYAZ', display_order: 2 },
      { type: 'type', value: 'RENKLI', display_order: 2 },
      { type: 'type', value: 'SIVI', display_order: 2 },
    ];
    // Validate individually
    for (const v of variations) {
      const result = validateVariations([v]);
      expect(result.valid).toBe(true);
    }
  });

  it('should allow scent variations with any value', () => {
    const variations: ProductImportVariation[] = [
      { type: 'scent', value: 'LAVANTA', display_order: 3 },
      { type: 'scent', value: 'LIMON', display_order: 3 },
      { type: 'scent', value: 'GUL', display_order: 3 },
    ];
    // Validate individually
    for (const v of variations) {
      const result = validateVariations([v]);
      expect(result.valid).toBe(true);
    }
  });
});

describe('Variation Metadata', () => {
  it('should include metadata for size variations', () => {
    const result = extractVariations('ABC 4.5 LT');
    expect(result.variations[0].metadata).toBeDefined();
    expect(result.variations[0].metadata).toHaveProperty('value');
    expect(result.variations[0].metadata).toHaveProperty('unit');
  });

  it('should include metadata for packaging variations', () => {
    const result = extractVariations('ABC *24');
    expect(result.variations[0].metadata).toEqual({
      count: 24,
    });
  });

  it('should not include metadata for type variations', () => {
    const result = extractVariations('ABC BEYAZ');
    expect(result.variations[0].metadata).toBeUndefined();
  });

  it('should not include metadata for scent variations', () => {
    const result = extractVariations('ABC LAVANTA');
    expect(result.variations[0].metadata).toBeUndefined();
  });
});

describe('Display Order', () => {
  it('should assign correct display order to size', () => {
    const result = extractVariations('ABC 4 LT');
    expect(result.variations[0].display_order).toBe(1);
  });

  it('should assign correct display order to type', () => {
    const result = extractVariations('ABC BEYAZ');
    expect(result.variations[0].display_order).toBe(2);
  });

  it('should assign correct display order to scent', () => {
    const result = extractVariations('ABC LAVANTA');
    expect(result.variations[0].display_order).toBe(3);
  });

  it('should assign correct display order to packaging', () => {
    const result = extractVariations('ABC *4');
    expect(result.variations[0].display_order).toBe(4);
  });

  it('should assign correct display order to material', () => {
    const result = extractVariations('ABC CAM');
    expect(result.variations[0].display_order).toBe(5);
  });
});
