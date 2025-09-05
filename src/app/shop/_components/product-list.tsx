'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './product-card';
import PurchaseModal from './purchase-modal';

type ProductListProps = {
  products: Product[];
};

export default function ProductList({ products }: ProductListProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handlePurchaseClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPurchaseClick={() => handlePurchaseClick(product)}
          />
        ))}
      </div>
      <PurchaseModal
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct}
      />
    </>
  );
}
