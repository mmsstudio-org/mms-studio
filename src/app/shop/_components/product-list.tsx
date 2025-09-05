'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './product-card';
import PurchaseModal from './purchase-modal';
import { useAuth } from '@/hooks/use-auth';
import ProductEditModal from './product-edit-modal';


type ProductListProps = {
  products: Product[];
  onProductUpdate: () => void;
};

export default function ProductList({ products, onProductUpdate }: ProductListProps) {
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user } = useAuth();

  const handlePurchaseClick = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseModalOpen(true);
  };
  
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
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
      />
       {user && (
        <ProductEditModal
          isOpen={isEditModalOpen}
          onOpenChange={setEditModalOpen}
          product={selectedProduct}
          onProductUpdate={() => {
            setEditModalOpen(false);
            onProductUpdate();
          }}
        />
      )}
    </>
  );
}
