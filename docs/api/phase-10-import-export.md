# Phase 10: Supplier Import/Export API

> API documentation for bulk product import/export functionality
> Version: 1.0.0
> Last Updated: 2025-01-05

## Overview

Phase 10 provides suppliers with the ability to bulk import and export products using Excel (.xlsx) and CSV formats. This API enables suppliers to manage large inventories efficiently through spreadsheet operations.

**Key Features:**
- Bulk product import (up to 1000 rows per file)
- Product export in Excel/CSV formats
- Import history tracking
- Template download for proper formatting
- RLS-based security per supplier
- File validation and error reporting
- Progress tracking for long-running imports

**Constraints:**
- Maximum file size: 10MB
- Maximum rows per import: 1000
- Supported formats: .xlsx, .csv
- Processing timeout: 60 seconds

---

## Authentication

All endpoints require authentication via Supabase Auth.

**Required Headers:**
```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Role Requirements:**
- `supplier` role with `approval_status = 'approved'`
- RLS policies ensure suppliers can only import/export their own products

---

## Base URL

```
https://<project-ref>.supabase.co/functions/v1/suppliers
```

---

## Endpoints

### 1. POST /api/suppliers/import

Upload and process an Excel or CSV file to create/update products in bulk.

#### Request

**Method:** `POST`
**URL:** `/api/suppliers/import`
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Excel (.xlsx) or CSV file (max 10MB) |
| `options` | JSON | No | Import options (JSON string) |
| `options.updateExisting` | boolean | No | Update existing products (default: false) |
| `options.validateOnly` | boolean | No | Validate without importing (default: false) |

**Example Request (cURL):**
```bash
curl -X POST \
  'https://<project-ref>.supabase.co/functions/v1/suppliers/import' \
  -H 'Authorization: Bearer <jwt_token>' \
  -F 'file=@products.xlsx' \
  -F 'options={"updateExisting":true,"validateOnly":false}'
```

**Example Request (JavaScript - TanStack Query):**
```typescript
import { useMutation } from '@tanstack/react-query';

const importProducts = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify({
      updateExisting: true,
      validateOnly: false
    }));

    const { data, error } = await supabase.functions.invoke('suppliers-import', {
      body: formData
    });

    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    toast.success(`Imported ${data.imported} products successfully`);
  }
});
```

#### Response

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "importId": "uuid-v4",
    "status": "completed",
    "imported": 45,
    "updated": 12,
    "failed": 2,
    "skipped": 5,
    "errors": [
      {
        "row": 15,
        "field": "base_price",
        "message": "Price must be greater than 0"
      },
      {
        "row": 23,
        "field": "category",
        "message": "Invalid category. Must be one of: vegetables, fruits, dairy, meat, bakery"
      }
    ],
    "warnings": [
      {
        "row": 8,
        "field": "stock",
        "message": "Stock value missing, defaulting to 0"
      }
    ],
    "processingTimeMs": 2340,
    "fileInfo": {
      "name": "products.xlsx",
      "size": 24586,
      "rows": 64
    }
  }
}
```

**Validation Mode Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "importId": null,
    "status": "validated",
    "validRows": 58,
    "invalidRows": 6,
    "errors": [...],
    "warnings": [...]
  }
}
```

#### Error Responses

**400 Bad Request - Invalid File:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File format not supported. Please upload .xlsx or .csv files",
    "details": {
      "receivedType": "application/pdf",
      "supportedTypes": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"]
    }
  }
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit",
    "details": {
      "maxSizeBytes": 10485760,
      "receivedSizeBytes": 15728640
    }
  }
}
```

**422 Unprocessable Entity - Too Many Rows:**
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_ROWS",
    "message": "File contains 1250 rows. Maximum allowed is 1000 rows per import",
    "details": {
      "maxRows": 1000,
      "actualRows": 1250
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden - Not Approved Supplier:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only approved suppliers can import products"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "IMPORT_FAILED",
    "message": "Failed to process import file",
    "details": {
      "internalError": "Database connection timeout"
    }
  }
}
```

#### File Format Requirements

**Required Columns:**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `name` | string | Product name | "Domates" |
| `category` | string | Product category | "vegetables" |
| `base_price` | number | Base price (TL) | 25.50 |
| `unit` | enum | Unit type: kg, adet, demet, paket | "kg" |

**Optional Columns:**
| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `description` | string | Product description | null |
| `origin` | string | Product origin | null |
| `stock` | number | Available stock | 0 |
| `quality` | enum | Quality grade: premium, standart, ekonomik | "standart" |
| `availability` | enum | Availability: plenty, limited, last | "plenty" |
| `is_active` | boolean | Product active status | true |
| `is_bugun_halde` | boolean | Show on "Bugün Halde" | false |

**Excel Template Structure:**
```csv
name,category,base_price,unit,description,origin,stock,quality,availability,is_active,is_bugun_halde
Domates,vegetables,25.50,kg,Yerli domates,Antalya,100,standart,plenty,true,true
Salatalık,vegetables,18.00,kg,Taze salatalık,Mersin,50,premium,limited,true,false
```

#### Rate Limiting

- **10 requests per hour** per supplier
- **1 concurrent import** at a time per supplier

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704460800
```

---

### 2. GET /api/suppliers/export

Export supplier's products as Excel or CSV file.

#### Request

**Method:** `GET`
**URL:** `/api/suppliers/export`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | Export format: `xlsx` or `csv` |
| `category` | string | No | Filter by category |
| `isActive` | boolean | No | Filter by active status |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |
| `limit` | number | No | Maximum rows (default: 1000, max: 1000) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request (cURL):**
```bash
curl -X GET \
  'https://<project-ref>.supabase.co/functions/v1/suppliers/export?format=xlsx&category=vegetables&isActive=true' \
  -H 'Authorization: Bearer <jwt_token>' \
  -o products.xlsx
```

**Example Request (JavaScript - TanStack Query):**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['export-products', 'xlsx', 'vegetables'],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke('suppliers-export', {
      body: {
        format: 'xlsx',
        category: 'vegetables',
        isActive: true
      }
    });

    if (error) throw error;

    // Download file
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.xlsx`;
    a.click();

    return data;
  }
});
```

#### Response

**Success Response (200 OK):**

**For Excel (.xlsx):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="products-20250105.xlsx"
Content-Length: 24586

<Binary Excel file data>
```

**For CSV (.csv):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="products-20250105.csv"
Content-Length: 12456

id,name,category,base_price,unit,description,origin,stock,quality,availability,is_active,is_bugun_halde,created_at,updated_at
uuid-1,Domates,vegetables,25.50,kg,Yerli domates,Antalya,100,standart,plenty,true,true,2025-01-01T10:00:00Z,2025-01-05T14:30:00Z
uuid-2,Salatalık,vegetables,18.00,kg,Taze salatalık,Mersin,50,premium,limited,true,false,2025-01-02T09:00:00Z,2025-01-05T14:30:00Z
```

**JSON Response (metadata):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid-v4",
    "format": "xlsx",
    "rowCount": 45,
    "fileSize": 24586,
    "filename": "products-20250105.xlsx",
    "filters": {
      "category": "vegetables",
      "isActive": true
    },
    "generatedAt": "2025-01-05T14:30:00Z"
  }
}
```

#### Error Responses

**400 Bad Request - Invalid Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Invalid format parameter. Must be 'xlsx' or 'csv'",
    "details": {
      "received": "pdf",
      "allowed": ["xlsx", "csv"]
    }
  }
}
```

**404 Not Found - No Products:**
```json
{
  "success": false,
  "error": {
    "code": "NO_PRODUCTS",
    "message": "No products found matching the specified filters",
    "details": {
      "filters": {
        "category": "meat",
        "isActive": true
      }
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "EXPORT_FAILED",
    "message": "Failed to generate export file",
    "details": {
      "internalError": "Excel generation timeout"
    }
  }
}
```

#### Rate Limiting

- **20 requests per hour** per supplier
- **5 concurrent exports** at a time per supplier

---

### 3. GET /api/suppliers/imports

Get import history for the authenticated supplier.

#### Request

**Method:** `GET`
**URL:** `/api/suppliers/imports`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: pending, completed, failed |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |
| `fromDate` | string | No | ISO 8601 date filter (e.g., 2025-01-01) |
| `toDate` | string | No | ISO 8601 date filter (e.g., 2025-01-31) |

**Example Request (cURL):**
```bash
curl -X GET \
  'https://<project-ref>.supabase.co/functions/v1/suppliers/imports?status=completed&limit=20' \
  -H 'Authorization: Bearer <jwt_token>'
```

**Example Request (JavaScript - TanStack Query):**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['import-history', 'completed'],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke('suppliers-imports', {
      body: {
        status: 'completed',
        limit: 20
      }
    });

    if (error) throw error;
    return data;
  }
});
```

#### Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "imports": [
      {
        "id": "uuid-1",
        "status": "completed",
        "imported": 45,
        "updated": 12,
        "failed": 2,
        "skipped": 5,
        "processingTimeMs": 2340,
        "fileName": "products.xlsx",
        "fileSize": 24586,
        "createdAt": "2025-01-05T10:30:00Z",
        "completedAt": "2025-01-05T10:30:02Z",
        "errorSummary": "2 rows failed validation"
      },
      {
        "id": "uuid-2",
        "status": "completed",
        "imported": 100,
        "updated": 0,
        "failed": 0,
        "skipped": 0,
        "processingTimeMs": 3450,
        "fileName": "bulk-import.csv",
        "fileSize": 45120,
        "createdAt": "2025-01-04T15:20:00Z",
        "completedAt": "2025-01-04T15:20:03Z",
        "errorSummary": null
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "summary": {
      "totalImports": 45,
      "completed": 40,
      "failed": 3,
      "pending": 2
    }
  }
}
```

#### Error Responses

**400 Bad Request - Invalid Status:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Invalid status parameter. Must be 'pending', 'completed', or 'failed'",
    "details": {
      "received": "processing",
      "allowed": ["pending", "completed", "failed"]
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Rate Limiting

- **60 requests per hour** per supplier
- **No concurrent limit** (read-only operation)

---

### 4. GET /api/suppliers/template/:format

Download an Excel or CSV template with the correct column structure.

#### Request

**Method:** `GET`
**URL:** `/api/suppliers/template/:format`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | Template format: `xlsx` or `csv` |

**Example Request (cURL):**
```bash
curl -X GET \
  'https://<project-ref>.supabase.co/functions/v1/suppliers/template/xlsx' \
  -H 'Authorization: Bearer <jwt_token>' \
  -o import-template.xlsx
```

**Example Request (JavaScript):**
```typescript
const downloadTemplate = async (format: 'xlsx' | 'csv') => {
  const { data, error } = await supabase.functions.invoke('suppliers-template', {
    body: { format }
  });

  if (error) throw error;

  // Download file
  const blob = new Blob([data], {
    type: format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `import-template.${format}`;
  a.click();
};
```

#### Response

**Success Response (200 OK):**

**For Excel (.xlsx):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="import-template.xlsx"
Content-Length: 8562

<Binary Excel file with sample data and column descriptions>
```

**For CSV (.csv):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="import-template.csv"
Content-Length: 542

name,category,base_price,unit,description,origin,stock,quality,availability,is_active,is_bugun_halde
Domates,vegetables,25.50,kg,Yerli domates,Antalya,100,standart,plenty,true,true
Salatalık,vegetables,18.00,kg,Taze salatalık,Mersin,50,premium,limited,true,false
```

**Template Contents:**

| Column | Required | Description | Valid Values | Example |
|--------|----------|-------------|--------------|---------|
| name | Yes | Product name | Text (2-100 chars) | "Domates" |
| category | Yes | Product category | vegetables, fruits, dairy, meat, bakery, pantry | "vegetables" |
| base_price | Yes | Base price in TL | Number > 0 | 25.50 |
| unit | Yes | Unit of measurement | kg, adet, demet, paket | "kg" |
| description | No | Product description | Text (max 500 chars) | "Yerli domates" |
| origin | No | Product origin | Text (max 100 chars) | "Antalya" |
| stock | No | Available stock | Number >= 0 | 100 |
| quality | No | Quality grade | premium, standart, ekonomik | "standart" |
| availability | No | Stock status | plenty, limited, last | "plenty" |
| is_active | No | Active status | true, false | true |
| is_bugun_halde | No | Show on homepage | true, false | true |

#### Error Responses

**400 Bad Request - Invalid Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Invalid format parameter. Must be 'xlsx' or 'csv'",
    "details": {
      "received": "pdf",
      "allowed": ["xlsx", "csv"]
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Rate Limiting

- **No rate limiting** (publicly available for authenticated suppliers)
- **Cached for 24 hours** per format

---

## Database Schema

### Import History Table

```sql
CREATE TABLE supplier_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  imported INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  errors JSONB,
  processing_time_ms INTEGER,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- RLS
  CONSTRAINT supplier_imports_supplier_fk
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- RLS Policy
ALTER TABLE supplier_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their own imports"
  ON supplier_imports FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can insert their own imports"
  ON supplier_imports FOR INSERT
  WITH CHECK (supplier_id = auth.uid());

-- Indexes
CREATE INDEX idx_supplier_imports_supplier_id ON supplier_imports(supplier_id);
CREATE INDEX idx_supplier_imports_status ON supplier_imports(status);
CREATE INDEX idx_supplier_imports_created_at ON supplier_imports(created_at DESC);
```

---

## Frontend Integration

### React Hook Example

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import Hook
export function useProductImport() {
  return useMutation({
    mutationFn: async ({
      file,
      options
    }: {
      file: File;
      options?: {
        updateExisting?: boolean;
        validateOnly?: boolean;
      };
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options || {}));

      const { data, error } = await supabase.functions.invoke('suppliers-import', {
        body: formData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.data.failed > 0) {
        toast.warning(
          `Imported ${data.data.imported} products, ${data.data.failed} failed`
        );
      } else {
        toast.success(`Imported ${data.data.imported} products successfully`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Import failed');
    }
  });
}

// Export Hook
export function useProductExport() {
  return useMutation({
    mutationFn: async (params: {
      format: 'xlsx' | 'csv';
      filters?: {
        category?: string;
        isActive?: boolean;
        minPrice?: number;
        maxPrice?: number;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke('suppliers-export', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, params) => {
      const blob = new Blob([data], {
        type: params.format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${Date.now()}.${params.format}`;
      a.click();

      toast.success('Products exported successfully');
    }
  });
}

// Import History Hook
export function useImportHistory(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['import-history', filters],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('suppliers-imports', {
        body: filters || {}
      });

      if (error) throw error;
      return data;
    }
  });
}

// Template Download Hook
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (format: 'xlsx' | 'csv') => {
      const { data, error } = await supabase.functions.invoke('suppliers-template', {
        body: { format }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, format) => {
      const blob = new Blob([data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-template.${format}`;
      a.click();

      toast.success('Template downloaded');
    }
  });
}
```

### Component Example

```typescript
import { useProductImport, useDownloadTemplate } from '@/hooks/useImportExport';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { useRef } from 'react';

export function ProductImportExport() {
  const importMutation = useProductImport();
  const downloadTemplate = useDownloadTemplate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importMutation.mutate({
      file,
      options: {
        updateExisting: true,
        validateOnly: false
      }
    });
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={importMutation.isPending}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import Products
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button
        variant="outline"
        onClick={() => downloadTemplate.mutate('xlsx')}
        disabled={downloadTemplate.isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Template
      </Button>
    </div>
  );
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_FILE` | 400 | Uploaded file format not supported |
| `FILE_TOO_LARGE` | 413 | File exceeds 10MB limit |
| `TOO_MANY_ROWS` | 422 | File contains more than 1000 rows |
| `INVALID_FORMAT` | 400 | Invalid format parameter |
| `INVALID_STATUS` | 400 | Invalid status filter |
| `NO_PRODUCTS` | 404 | No products found for export |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `IMPORT_FAILED` | 500 | Import processing failed |
| `EXPORT_FAILED` | 500 | Export generation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |

---

## Testing

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { parseImportFile } from '@/lib/import-parser';

describe('Import Parser', () => {
  it('should parse valid Excel file', async () => {
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const result = await parseImportFile(file);
    expect(result.rows).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  it('should reject file with too many rows', async () => {
    const file = new File([''], 'large.xlsx');
    // Mock 1500 rows...

    await expect(parseImportFile(file)).rejects.toThrow('TOO_MANY_ROWS');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    // Login as supplier
    await page.goto('/login');
    await page.fill('[name="email"]', 'supplier@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/supplier');
  });

  test('should import products from Excel file', async ({ page }) => {
    await page.goto('/supplier/products');
    await page.click('button:has-text("Import")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/products.xlsx');

    // Wait for success message
    await expect(page.locator('text=Imported 45 products')).toBeVisible();
  });

  test('should export products as Excel', async ({ page }) => {
    await page.goto('/supplier/products');
    await page.click('button:has-text("Export")');

    // Verify download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/products-.*\.xlsx/);
  });
});
```

---

## Deployment

### Supabase Edge Function Structure

```
supabase/
└── functions/
    ├── suppliers-import/
    │   └── index.ts          # Import handler
    ├── suppliers-export/
    │   └── index.ts          # Export handler
    ├── suppliers-imports/
    │   └── index.ts          # Import history handler
    └── suppliers-template/
        └── index.ts          # Template handler
```

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Import/Export Settings
IMPORT_MAX_FILE_SIZE_MB=10
IMPORT_MAX_ROWS=1000
IMPORT_TIMEOUT_SECONDS=60

# Storage
IMPORT_BUCKET_NAME=supplier-imports
```

---

## Security Considerations

1. **RLS Policies**: All queries enforce supplier isolation
2. **File Validation**: File type and size validated before processing
3. **Rate Limiting**: Per-supplier rate limits prevent abuse
4. **Input Sanitization**: All inputs validated and sanitized
5. **Error Handling**: Internal errors not exposed to clients
6. **Audit Trail**: All imports logged with metadata

---

## Monitoring & Logging

### Key Metrics

- Import success rate
- Average processing time
- Error types distribution
- File size distribution
- Rate limit violations

### Logging Format

```json
{
  "timestamp": "2025-01-05T10:30:00Z",
  "level": "info",
  "event": "product_import",
  "supplier_id": "uuid",
  "import_id": "uuid",
  "file_name": "products.xlsx",
  "file_size": 24586,
  "rows_processed": 64,
  "status": "completed",
  "processing_time_ms": 2340
}
```

---

## Changelog

### Version 1.0.0 (2025-01-05)
- Initial release
- Excel/CSV import support
- Export functionality
- Import history tracking
- Template download
- Rate limiting
- RLS security

---

## Support

For issues or questions:
- GitHub Issues: [repository]/issues
- Documentation: [repository]/docs
- API Status: https://status.supabase.com
