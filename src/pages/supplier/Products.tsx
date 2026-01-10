// Supplier Products Page with Tabs (Phase 12: Multi-Supplier)
// - Tüm Ürünler: Global product catalog with price entry
// - Benim Ürünlerim: Supplier's priced products with edit/delete

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SupplierMobileLayout } from '@/components/supplier/SupplierMobileLayout';
import { AllProductsTab } from '@/components/supplier/AllProductsTab';
import { MyProductsTab } from '@/components/supplier/MyProductsTab';

const STORAGE_KEY = 'supplier-products-tab';

type ProductTab = 'all-products' | 'my-products';

export default function SupplierProducts() {
  const [activeTab, setActiveTab] = useState<ProductTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'all-products' || saved === 'my-products') ? saved : 'my-products';
  });

  const handleTabChange = (value: string) => {
    const newTab = value as ProductTab;
    setActiveTab(newTab);
    localStorage.setItem(STORAGE_KEY, newTab);
  };

  return (
    <SupplierMobileLayout
      title="Ürünler"
      actionLabel={activeTab === 'my-products' ? 'Yeni Ürün' : undefined}
      actionHref={activeTab === 'my-products' ? '/tedarikci/urunler/yeni' : undefined}
      breadcrumbs={[
        { label: 'Panel', href: '/tedarikci' },
        { label: 'Ürünler' }
      ]}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all-products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Tüm Ürünler
          </TabsTrigger>
          <TabsTrigger value="my-products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Benim Ürünlerim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-products" className="mt-0">
          <AllProductsTab />
        </TabsContent>

        <TabsContent value="my-products" className="mt-0">
          <MyProductsTab />
        </TabsContent>
      </Tabs>
    </SupplierMobileLayout>
  );
}
