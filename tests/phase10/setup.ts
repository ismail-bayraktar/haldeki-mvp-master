/**
 * Phase 10 Test Setup
 * Shared test utilities and fixtures for import/export tests
 */

import { beforeEach } from 'vitest';
import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  })),
  rpc: vi.fn(),
};

// Test fixtures
export const testProducts = [
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
    images: ['https://example.com/domates.jpg'],
  },
  {
    name: 'Salatalık',
    category: 'Sebze',
    unit: 'kg',
    basePrice: 10,
    price: 15,
    stock: 50,
    origin: 'İzmir',
    quality: 'standart',
    availability: 'bol',
    description: 'Taze salatalık',
    images: ['https://example.com/salatalik.jpg'],
  },
  {
    name: 'Çilek',
    category: 'Meyve',
    unit: 'kg',
    basePrice: 30,
    price: 40,
    stock: 80,
    origin: 'Bursa',
    quality: 'premium',
    availability: 'limitli',
    description: 'Taze çilek',
    images: ['https://example.com/cilek.jpg'],
  },
];

export const testCSVContent = `Ürün Adı,Kategori,Birim,Taban Fiyat,Satış Fiyatı,Stok,Köken,Kalite,Durum
Domates,Sebze,kg,20,25,100,Antalya,premium,bol
Salatalık,Sebze,kg,10,15,50,İzmir,standart,bol
Çilek,Meyve,kg,30,40,80,Bursa,premium,limitli`;

export const invalidTestCSV = `Ürün Adı,Kategori,Birim,Taban Fiyat,Satış Fiyatı
Domates,Sebze,kg,invalid,25
,Sebze,kg,20,25
Patates,,kg,15,20`;

// Helper to create mock File objects
export function createMockFile(
  name: string,
  content: string | ArrayBuffer,
  mimeType: string
): File {
  const blob =
    typeof content === 'string'
      ? new Blob([content], { type: mimeType })
      : new Blob([content], { type: mimeType });

  return new File([blob], name, { type: mimeType });
}

// Helper to create mock Excel file
export function createMockExcelFile(data: any[][]): File {
  const content = JSON.stringify(data);
  return createMockFile('test.xlsx', content, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// Helper to create mock CSV file
export function createMockCSVFile(content: string): File {
  return createMockFile('test.csv', content, 'text/csv');
}

// Helper to generate random product data
export function generateRandomProduct(count: number = 1) {
  const categories = ['Sebze', 'Meyve', 'Bakliyat', 'Süt Ürünleri'];
  const units = ['kg', 'adet', 'demet', 'paket'];
  const origins = ['Antalya', 'İzmir', 'Bursa', 'Mersin', 'Türkiye'];
  const qualities = ['premium', 'standart', 'ekonomik'];
  const availabilities = ['bol', 'limitli', 'son'];

  return Array.from({ length: count }, (_, i) => ({
    name: `Ürün ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    unit: units[Math.floor(Math.random() * units.length)],
    basePrice: Math.floor(Math.random() * 100) + 10,
    price: Math.floor(Math.random() * 100) + 15,
    stock: Math.floor(Math.random() * 200),
    origin: origins[Math.floor(Math.random() * origins.length)],
    quality: qualities[Math.floor(Math.random() * qualities.length)],
    availability: availabilities[Math.floor(Math.random() * availabilities.length)],
    description: `Test ürün ${i + 1}`,
    images: [`https://example.com/img${i + 1}.jpg`],
  }));
}

// Setup function to reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
