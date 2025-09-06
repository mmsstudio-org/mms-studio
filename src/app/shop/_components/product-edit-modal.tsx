'use client';

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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Product, AppDetail } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addProduct, updateProduct, deleteProduct, getApps } from '@/lib/firestore-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  regularPrice: z.coerce.number().positive(),
  discountedPrice: z.coerce.number().positive().optional().or(z.literal('')),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  appId: z.string().min(1, { message: 'Please select an application.' }),
  type: z.enum(['subscription', 'coins']),
  coinAmount: z.coerce.number().positive().optional().or(z.literal('')),
  subscriptionDays: z.coerce.number().positive().optional().or(z.literal('')),
}).refine(data => {
    if (data.type === 'coins') {
        return !!data.coinAmount && Number(data.coinAmount) > 0;
    }
    return true;
}, {
    message: 'Coin amount is required for coin products.',
    path: ['coinAmount'],
}).refine(data => {
    if (data.type === 'subscription') {
        return !!data.subscriptionDays && Number(data.subscriptionDays) > 0;
    }
    return true;
}, {
    message: 'Subscription days are required for subscription products.',
    path: ['subscriptionDays'],
}).refine(data => {
    if (data.discountedPrice && data.regularPrice) {
        return Number(data.discountedPrice) <= Number(data.regularPrice);
    }
    return true;
}, {
    message: 'Discounted price cannot be greater than regular price.',
    path: ['discountedPrice'],
});

type ProductEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onProductUpdate: () => void;
  appForNewProduct?: AppDetail | null;
};

const Icon = ({ name, className }: { name: string; className: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
      return null;
    }
    return <LucideIcon className={className} />;
  };

export default function ProductEditModal({ isOpen, onOpenChange, product, onProductUpdate, appForNewProduct }: ProductEditModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apps, setApps] = useState<AppDetail[]>([]);

  useEffect(() => {
    async function fetchApps() {
        const fetchedApps = await getApps();
        setApps(fetchedApps);
    }
    if (isOpen) {
      fetchApps();
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        description: '',
        regularPrice: 0,
        discountedPrice: '',
        imageUrl: '',
        appId: '',
        type: 'subscription',
        coinAmount: '',
        subscriptionDays: '',
    },
  });
  
  const productType = form.watch('type');

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        description: product.description || '',
        discountedPrice: product.discountedPrice || '',
        imageUrl: product.imageUrl || '',
        coinAmount: product.coinAmount || '',
        subscriptionDays: product.subscriptionDays || '',
      });
    } else {
        form.reset({
            name: '',
            description: '',
            regularPrice: 0,
            discountedPrice: '',
            imageUrl: '',
            appId: appForNewProduct?.id || '',
            type: 'subscription',
            coinAmount: '',
            subscriptionDays: '',
        });
    }
  }, [product, appForNewProduct, form, isOpen]); // Rerun on isOpen to reset form for 'Add New'

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const productData = {
        ...values,
        description: values.description || "",
        discountedPrice: values.discountedPrice ? Number(values.discountedPrice) : 0,
        imageUrl: values.imageUrl || "",
        coinAmount: values.coinAmount ? Number(values.coinAmount) : 0,
        subscriptionDays: values.subscriptionDays ? Number(values.subscriptionDays) : 30,
    }

    try {
        if (product && product.id) {
            await updateProduct(product.id, productData);
            toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
        } else {
            await addProduct(productData as Product);
            toast({ title: 'Product Added', description: 'The new product has been successfully added.' });
        }
        onProductUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving product:", error, product);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!product || !product.id) return;
    if (!window.confirm(`Are you sure you want to delete the product "${product.name}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
        await deleteProduct(product.id);
        toast({ title: 'Product Deleted', description: 'The product has been successfully deleted.' });
        onProductUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Error deleting product:", error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsDeleting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Edit the details of this product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Monthly Subscription" {...field} />
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
                        <Textarea placeholder="Describe the product..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="regularPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Regular Price (৳)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 100" {...field} />
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
                        <FormLabel>Discounted Price (৳) (Optional)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 80" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com/image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="appId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Application</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!!appForNewProduct}>
                            <FormControl>
                                <SelectTrigger>
                                     <SelectValue placeholder="Select an app" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {apps.map(app => (
                                    <SelectItem key={app.id} value={app.id}>
                                        <div className="flex items-center gap-2">
                                            {app.icon && app.icon.startsWith('http') ? (
                                                <Image src={app.icon} alt={app.name} width={20} height={20} className="rounded-md" />
                                            ) : app.icon ? (
                                                <Icon name={app.icon} className="h-5 w-5" />
                                            ) : (
                                                <div className="h-5 w-5 bg-muted rounded-md flex items-center justify-center text-xs">
                                                  {app.name.charAt(0)}
                                                </div>
                                            )}
                                            {app.name}
                                        </div>
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
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="subscription">Subscription</SelectItem>
                               <SelectItem value="coins">Coins</SelectItem>
                            </SelectContent>
                        </Select>
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
                           <Input type="number" placeholder="e.g., 30" {...field} />
                        </FormControl>
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
                            <Input type="number" placeholder="e.g., 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
              {product && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto ml-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
