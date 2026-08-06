'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/components/ui/confirm-provider';
import { useToast } from '@/hooks/use-toast';
import { deleteProduct } from '@/lib/firestore-service';
import type { Product } from '@/lib/types';
import {
  Pencil,
  Trash2,
  Package,
  CircleDollarSign,
  CalendarDays,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { formatSubscriptionDuration } from './format-subscription-duration';

type ProductsTableProps = {
  products: Product[];
  categoryId: string;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
};

export default function ProductsTable({
  products,
  categoryId,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const { toast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async (product: Product) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      description: `Are you sure you want to delete the product "${product.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteProduct(product.id!);
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      onDelete(product.id!);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete product.',
      });
    }
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">
        No products found for this category. Click "Add Product" to create one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.imageUrl ? (
                  <div className="relative h-10 w-10 rounded overflow-hidden border">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : product.type === 'subscription' ? (
                  <Package className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className="font-semibold text-sm max-w-[150px] truncate">
                {product.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {product.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {product.discountedPrice ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-accent">
                      ৳{product.discountedPrice}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      ৳{product.regularPrice}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold">৳{product.regularPrice}</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground space-y-1">
                {product.type === 'subscription' && product.subscriptionDays && (
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatSubscriptionDuration(product.subscriptionDays)}</span>
                  </div>
                )}

                {!!product.coinAmount && product.coinAmount > 0 && (
                  <div className="text-amber-500 font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4 fill-amber-500" />
                    {product.coinAmount.toLocaleString()} Credits
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Edit Product"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(product)}
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}