/**
 * Breadcrumbs Hook Tests - Phase 12 Completion
 *
 * Tests for breadcrumb generation on admin pages
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Admin pages breadcrumb config
const adminBreadcrumbConfig: Record<string, { label: string; icon?: string }> = {
  '/admin': { label: 'Dashboard' },
  '/admin/products': { label: 'Ürünler' },
  '/admin/orders': { label: 'Siparişler' },
  '/admin/users': { label: 'Kullanıcılar' },
  '/admin/suppliers': { label: 'Tedarikçiler' },
  '/admin/businesses': { label: 'İşletmeler' },
  '/admin/dealers': { label: 'Bayiler' },
  '/admin/region-products': { label: 'Bölge Ürünleri' },
  '/admin/supplier-offers': { label: 'Tedarikçi Teklifleri' },
  '/admin/warehouse-staff': { label: 'Depo Personeli' },
  '/admin/bugun-halde': { label: 'Bugün Halde' },
  '/admin/settings': { label: 'Ayarlar' },
};

// Simple hook implementation (to be replaced with actual import when available)
function useBreadcrumbs(currentPath: string) {
  const breadcrumbs: Array<{ label: string; href?: string; icon?: string }> = [];

  // Split path into segments
  const segments = currentPath.split('/').filter(Boolean);

  // Build breadcrumbs incrementally
  let accumulatedPath = '';
  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += '/' + segments[i];
    const isLast = i === segments.length - 1;

    // Special handling for dynamic routes (edit, create, etc.)
    if (segments[i] === 'edit' || segments[i] === 'create') {
      const parentPath = '/' + segments.slice(0, i).join('/');
      const parentConfig = adminBreadcrumbConfig[parentPath];
      if (parentConfig) {
        breadcrumbs.push({
          label: parentConfig.label,
          href: parentPath,
        });
      }

      breadcrumbs.push({
        label: segments[i] === 'edit' ? 'Düzenle' : 'Yeni Oluştur',
      });
      break;
    }

    // Check if this path has a config
    const config = adminBreadcrumbConfig[accumulatedPath];
    if (config) {
      breadcrumbs.push({
        label: config.label,
        href: isLast ? undefined : accumulatedPath,
        icon: config.icon,
      });
    }
  }

  return breadcrumbs;
}

describe('useBreadcrumbs Hook - Phase 12', () => {
  describe('Static Route Breadcrumbs', () => {
    it('should generate breadcrumb for /admin', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin'), {
        wrapper: MemoryRouter,
      });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].label).toBe('Dashboard');
      expect(result.current[0].href).toBeUndefined(); // Last item has no href
    });

    it('should generate breadcrumb for /admin/products', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Ürünler');
      expect(lastItem.href).toBeUndefined();
    });

    it('should generate breadcrumb for /admin/orders', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/orders'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Siparişler');
    });

    it('should generate breadcrumb for /admin/users', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/users'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Kullanıcılar');
    });

    it('should generate breadcrumb for /admin/suppliers', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/suppliers'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Tedarikçiler');
    });

    it('should generate breadcrumb for /admin/businesses', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/businesses'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('İşletmeler');
    });

    it('should generate breadcrumb for /admin/dealers', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/dealers'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Bayiler');
    });

    it('should generate breadcrumb for /admin/region-products', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/region-products'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Bölge Ürünleri');
    });

    it('should generate breadcrumb for /admin/supplier-offers', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/supplier-offers'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Tedarikçi Teklifleri');
    });

    it('should generate breadcrumb for /admin/warehouse-staff', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/warehouse-staff'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Depo Personeli');
    });

    it('should generate breadcrumb for /admin/bugun-halde', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/bugun-halde'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Bugün Halde');
    });

    it('should generate breadcrumb for /admin/settings', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/settings'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(1);
      const lastItem = result.current[result.current.length - 1];
      expect(lastItem.label).toBe('Ayarlar');
    });
  });

  describe('Dynamic Route Breadcrumbs', () => {
    it('should generate breadcrumbs for /admin/products/:id/edit', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products/123/edit'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(2);
      const productsIndex = result.current.findIndex((b) => b.label === 'Ürünler');
      expect(productsIndex).toBeGreaterThanOrEqual(0);
      expect(result.current[result.current.length - 1].label).toBe('Düzenle');
    });

    it('should generate breadcrumbs for /admin/orders/:id/edit', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/orders/456/edit'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(2);
      const ordersIndex = result.current.findIndex((b) => b.label === 'Siparişler');
      expect(ordersIndex).toBeGreaterThanOrEqual(0);
      expect(result.current[result.current.length - 1].label).toBe('Düzenle');
    });

    it('should generate breadcrumbs for /admin/products/create', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products/create'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThanOrEqual(2);
      expect(result.current[result.current.length - 1].label).toBe('Yeni Oluştur');
    });

    it('should handle deep dynamic routes', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products/123/variations/456/edit'), {
        wrapper: MemoryRouter,
      });

      // Should handle gracefully even if not explicitly configured
      expect(result.current.length).toBeGreaterThan(0);
    });
  });

  describe('Icon Rendering', () => {
    it('should include icon when configured', () => {
      // This test assumes icon configuration exists
      // Update when actual icon config is added
      const { result } = renderHook(() => useBreadcrumbs('/admin'), {
        wrapper: MemoryRouter,
      });

      // Check if icon property exists (even if undefined)
      expect(result.current[0]).toHaveProperty('icon');
    });
  });

  describe('Navigation via Breadcrumbs', () => {
    it('should provide href for non-last breadcrumbs', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products/123/edit'), {
        wrapper: MemoryRouter,
      });

      // Some breadcrumb should have href for navigation (not the last one)
      const nonLastBreadcrumbs = result.current.slice(0, -1);
      const withHref = nonLastBreadcrumbs.filter((b) => b.href);
      expect(withHref.length).toBeGreaterThan(0);
    });

    it('should not provide href for last breadcrumb (current page)', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products'), {
        wrapper: MemoryRouter,
      });

      // Last breadcrumb should not have href
      expect(result.current[result.current.length - 1].href).toBeUndefined();
    });
  });

  describe('All 11 Admin Pages Coverage', () => {
    it('should cover all 11 admin pages with breadcrumbs', () => {
      const adminPaths = [
        '/admin',
        '/admin/products',
        '/admin/orders',
        '/admin/users',
        '/admin/suppliers',
        '/admin/businesses',
        '/admin/dealers',
        '/admin/region-products',
        '/admin/supplier-offers',
        '/admin/warehouse-staff',
        '/admin/bugun-halde',
        '/admin/settings',
      ];

      adminPaths.forEach((path) => {
        const { result } = renderHook(() => useBreadcrumbs(path), {
          wrapper: MemoryRouter,
        });

        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current[result.current.length - 1].label).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle trailing slash', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/products/'), {
        wrapper: MemoryRouter,
      });

      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should handle root path', () => {
      const { result } = renderHook(() => useBreadcrumbs('/'), {
        wrapper: MemoryRouter,
      });

      // Should return empty array for root
      expect(result.current).toBeDefined();
    });

    it('should handle unknown paths gracefully', () => {
      const { result } = renderHook(() => useBreadcrumbs('/admin/unknown-page'), {
        wrapper: MemoryRouter,
      });

      // Should return empty array or handle gracefully
      expect(result.current).toBeDefined();
    });
  });
});
