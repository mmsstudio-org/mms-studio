
'use client';

import { useState } from 'react';
import type { Product, AppDetail } from '@/lib/types';
import ProductCard from './product-card';
import PurchaseModal from './purchase-modal';
import { useAuth } from '@/hooks/use-auth';
import ProductFormModal from '@/app/dashboard/categories/[id]/_components/product-form-modal';

type ProductListProps = {
  products: Product[];
  onProductUpdate: () => void;
  app: AppDetail;
};

export default function ProductList({ products, onProductUpdate, app }: ProductListProps) {
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const { user } = useAuth();

  const handlePurchaseClick = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    if (product.id) setEditingProductId(product.id);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPurchaseClick={() => handlePurchaseClick(product)}
            onEditClick={() => handleEditClick(product)}
          />
        ))}
      </div>
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        product={selectedProduct}
        app={app}
      />
      <ProductFormModal
        isOpen={!!editingProductId}
        onOpenChange={(open) => { if (!open) setEditingProductId(null); }}
        defaultAppId={app.id}
        productId={editingProductId}
        onSaved={onProductUpdate}
      />
    </>
  );
}
