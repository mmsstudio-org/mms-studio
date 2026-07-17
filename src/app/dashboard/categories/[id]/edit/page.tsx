'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/confirm-provider';
import { getApp, updateApp, checkCategorySlugUnique, getProductsForApp, deleteProduct } from '@/lib/firestore-service';
import type { AppDetail, Product } from '@/lib/types';
import { Loader2, ArrowLeft, PlusCircle, Pencil, Trash2, Package, CircleDollarSign, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const youtubeIdOrUrlSchema = z.string().optional().refine(val => {
    if (!val) return true;
    if (youtubeRegex.test(val)) return true;
    if (val.length === 11 && /^[a-zA-Z0-9_-]+$/.test(val)) return true;
    return false;
}, {
    message: "Please enter a valid YouTube video URL or Video ID."
});

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters.' }).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
  }),
  description: z.string().optional(),
  icon: z.union([z.string().url(), z.string().length(0), z.string().refine(s => !s.startsWith('http'))]).optional(),
  youtubeVideoUrl: youtubeIdOrUrlSchema,
  pkg: z.string().optional(),
});

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugConflict, setSlugConflict] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      youtubeVideoUrl: '',
      pkg: '',
    },
  });

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const categorySnap = await getApp(categoryId);
      if (categorySnap) {
        setApp(categorySnap);
        form.reset({
          name: categorySnap.name,
          slug: categorySnap.slug || '',
          description: categorySnap.description || '',
          icon: categorySnap.icon || '',
          youtubeVideoUrl: categorySnap.youtubeVideoId || '',
          pkg: categorySnap.pkg || '',
        });

        const appProducts = await getProductsForApp(categoryId);
        setProducts(appProducts);
      } else {
        toast({ variant: 'destructive', title: 'Not Found', description: 'Category does not exist.' });
        router.push('/dashboard/categories');
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch details.' });
    } finally {
      setLoadingData(false);
    }
  }, [categoryId, form, router, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  function getYouTubeVideoId(urlOrId: string): string {
    if (!urlOrId) return "";
    const match = urlOrId.match(youtubeRegex);
    if (match && match[1]) {
      return match[1];
    }
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
        return urlOrId;
    }
    return "";
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSlugConflict('');

    try {
      // Validate unique slug
      const isUnique = await checkCategorySlugUnique(values.slug, categoryId);
      if (!isUnique) {
        setSlugConflict('This slug is already taken. Please enter a unique slug.');
        form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        toast({ variant: 'destructive', title: 'Slug conflict', description: 'Please use a unique slug.' });
        setIsSubmitting(false);
        return;
      }

      const videoId = getYouTubeVideoId(values.youtubeVideoUrl || "");
      const appData = {
        name: values.name,
        slug: values.slug,
        description: values.description || "",
        icon: values.icon || "",
        youtubeVideoId: videoId,
        pkg: values.pkg || "",
      };

      await updateApp(categoryId, appData);
      toast({ title: 'Success', description: 'Category updated successfully.' });
      fetchData();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }

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
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Failed to delete product.' });
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
    <div className="container py-10 px-4 max-w-5xl space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/categories" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Category Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-['Orbitron']">Edit Category Details</CardTitle>
              <CardDescription>Update general settings and metadata.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BNC Status App" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL Path)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., bnc-status-app" {...field} />
                        </FormControl>
                        <FormMessage />
                        {slugConflict && <p className="text-sm font-medium text-destructive mt-1">{slugConflict}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this category..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Lucide name or URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Smartphone or https://example.com/icon.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pkg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., com.example.app" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtubeVideoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tutorial Video (YouTube URL or ID)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Associated Products Manager */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold font-['Orbitron']">Products in {app.name}</h2>
              <p className="text-muted-foreground text-sm">Add or edit package plans inside this category.</p>
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
                  No products found for this category. Click "Add Product" to create one.
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
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
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
                                <span className="font-bold text-accent">৳{product.discountedPrice}</span>
                                <span className="text-xs text-muted-foreground line-through">৳{product.regularPrice}</span>
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
                              <div className="text-amber-500 font-semibold">
                                🪙 {product.coinAmount.toLocaleString()} Coins
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Edit Product">
                                <Link href={`/dashboard/categories/${categoryId}/products/${product.id}/edit`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteProduct(product.id!, product.name)}
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
