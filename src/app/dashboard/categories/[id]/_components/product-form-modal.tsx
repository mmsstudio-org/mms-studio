'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { addProduct, updateProduct, getProduct, getApps } from '@/lib/firestore-service';
import { convertDriveUrl } from '@/app/dashboard/blogs/_components/blog-form';
import type { AppDetail, Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  regularPrice: z.coerce.number().min(1, { message: 'Regular price must be at least 1 BDT.' }),
  discountedPrice: z.union([z.coerce.number().min(0), z.string().length(0)]).optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['subscription', 'coins']),
  coinAmount: z.coerce.number().optional(),
  subscriptionDays: z.coerce.number().optional(),
  appId: z.string().min(1, { message: 'Please select a category.' }),
}).refine(data => {
  if (data.discountedPrice !== undefined && data.discountedPrice !== '') {
    const disc = Number(data.discountedPrice);
    return disc < data.regularPrice;
  }
  return true;
}, {
  message: 'Discounted price must be less than the regular price.',
  path: ['discountedPrice'],
});

type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormModalProps = {
  /** Open state */
  isOpen: boolean;
  /** Close handler */
  onOpenChange: (isOpen: boolean) => void;
  /** Default category ID (used for the route-level page) */
  defaultAppId?: string;
  /** Product ID when editing; null/undefined for create */
  productId?: string | null;
  /** Called after successful save */
  onSaved?: () => void;
};

export default function ProductFormModal({
  isOpen,
  onOpenChange,
  defaultAppId,
  productId,
  onSaved,
}: ProductFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [apps, setApps] = useState<AppDetail[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      regularPrice: 0,
      discountedPrice: '',
      imageUrl: '',
      type: 'subscription',
      coinAmount: 0,
      subscriptionDays: 30,
      appId: defaultAppId || '',
    },
  });

  const productType = form.watch('type');

  // Reset form when modal opens / productId changes
  useEffect(() => {
    if (!isOpen) return;

    // Fetch apps for category dropdown
    getApps()
      .then((list) => setApps(list))
      .catch((e) => console.error(e));

    if (productId) {
      // Edit mode: load product details
      setIsLoading(true);
      getProduct(productId)
        .then((prod: Product | null) => {
          if (prod) {
            setCategoryName(prod.name);
            form.reset({
              name: prod.name,
              description: prod.description || '',
              regularPrice: prod.regularPrice,
              discountedPrice: prod.discountedPrice !== undefined && prod.discountedPrice !== null ? prod.discountedPrice : '',
              imageUrl: prod.imageUrl || '',
              type: prod.type,
              coinAmount: prod.coinAmount || 0,
              subscriptionDays: prod.subscriptionDays || 30,
              appId: prod.appId || defaultAppId || '',
            });
          } else {
            toast({ variant: 'destructive', title: 'Not Found', description: 'Product does not exist.' });
            onOpenChange(false);
          }
        })
        .catch((e) => {
          console.error(e);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch product details.' });
        })
        .finally(() => setIsLoading(false));
    } else {
      // Create mode
      setCategoryName('');
      form.reset({
        name: '',
        description: '',
        regularPrice: 0,
        discountedPrice: '',
        imageUrl: '',
        type: 'subscription',
        coinAmount: 0,
        subscriptionDays: 30,
        appId: defaultAppId || '',
      });
    }
  }, [isOpen, productId, form, defaultAppId, toast, onOpenChange]);

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);

    const discPrice = values.discountedPrice === '' ? undefined : Number(values.discountedPrice);
    const coinAmt = values.coinAmount || 0;
    const subDays = values.type === 'subscription' ? values.subscriptionDays : undefined;

    const productPayload: any = {
      appId: values.appId,
      name: values.name,
      description: values.description || '',
      type: values.type,
      regularPrice: values.regularPrice,
      imageUrl: values.imageUrl || '',
      coinAmount: coinAmt,
    };

    if (discPrice !== undefined) {
      productPayload.discountedPrice = discPrice;
    }

    if (subDays !== undefined) {
      productPayload.subscriptionDays = subDays;
    }

    try {
      if (productId) {
        await updateProduct(productId, productPayload);
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        await addProduct(productPayload);
        toast({ title: 'Success', description: 'Product added successfully.' });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: productId ? 'Error' : 'Error',
        description: productId ? 'Failed to update product.' : 'Failed to add product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Orbitron']">
            {productId ? `Edit Product${categoryName ? ` in ${categoryName}` : ''}` : `Add Product${categoryName ? ` to ${categoryName}` : ''}`}
          </DialogTitle>
          <DialogDescription>
            {productId ? 'Update purchase option or package plan details.' : 'Create a new purchase option or package plan.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && productId ? (
          <div className="py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="appId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {apps.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription / Combo</SelectItem>
                        <SelectItem value="coins">Coins Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 Month Premium subscription" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details about this package..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="regularPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Price (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discounted Price (BDT - Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="No discount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {productType === 'subscription' && (
                <FormField
                  control={form.control}
                  name="subscriptionDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Duration (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Specify number of days (e.g. 30 for monthly, 365 for annual).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {productType === 'coins' && (
                <FormField
                  control={form.control}
                  name="coinAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coin Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {productType === 'subscription' && (
                <FormField
                  control={form.control}
                  name="coinAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coins Included (Optional Combo)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Set this if this subscription package also awards coins.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Direct URL or Google Drive share link"
                        value={field.value}
                        onChange={(e) => {
                          const converted = convertDriveUrl(e.target.value);
                          field.onChange(converted);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Tip: Google Drive share links are converted to downloadable URLs automatically.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {productId ? 'Save Changes' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}