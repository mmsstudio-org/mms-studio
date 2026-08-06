'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/confirm-provider';
import {
  getApp,
  getProductsForApp,
  deleteProduct,
} from '@/lib/firestore-service';
import type { AppDetail, Product } from '@/lib/types';
import {
  Loader2,
  ArrowLeft,
  PlusCircle,
  Pencil,
  Trash2,
  Package,
  CircleDollarSign,
  CalendarDays,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CategoryForm from '../../_components/category-form';

function formatSubscriptionDuration(days?: number) {
  if (!days) return null;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} ${years > 1 ? 'years' : 'year'}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} ${months > 1 ? 'months' : 'month'}`;
  }
  return `${days} days`;
}

export default function EditCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { toast } = useToast();
  const confirm = useConfirm();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const categorySnap = await getApp(categoryId);
      if (categorySnap) {
        setApp(categorySnap);
        const appProducts = await getProductsForApp(categoryId);
        setProducts(appProducts);
      } else {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: 'Category does not exist.',
        });
        router.push('/dashboard/categories');
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch details.',
      });
    } finally {
      setLoadingData(false);
    }
  }, [categoryId, router, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  const handleDeleteProduct = async (productId: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      description: `Are you sure you want to delete the product "${name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete product.',
      });
    }
  };

  if (authLoading || loadingData || !app) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Category Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-['Orbitron']">
                Edit Category Details
              </CardTitle>
              <CardDescription>
                Update general settings and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm
                mode="edit"
                categoryId={categoryId}
                initialData={app}
                onSuccess={fetchData}
                submitLabel="Save Changes"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Associated Products Manager */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold font-['Orbitron']">
                Products in {app.name}
              </h2>
              <p className="text-muted-foreground text-sm">
                Add or edit package plans inside this category.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/dashboard/categories/${categoryId}/products/new`}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {products.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No products found for this category. Click "Add Product" to
                  create one.
                </div>
              ) : (
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
                              <span className="font-bold">
                                ৳{product.regularPrice}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground space-y-1">
                            {product.type === 'subscription' &&
                              product.subscriptionDays && (
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>
                                    {formatSubscriptionDuration(
                                      product.subscriptionDays,
                                    )}
                                  </span>
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
                                asChild
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Edit Product"
                              >
                                <Link
                                  href={`/dashboard/categories/${categoryId}/products/${product.id}/edit`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleDeleteProduct(product.id!, product.name)
                                }
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}