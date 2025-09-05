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
import type { Product } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addProduct, updateProduct, deleteProduct } from '@/lib/firestore-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { APPS } from '@/lib/store';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  regularPrice: z.coerce.number().positive(),
  discountedPrice: z.coerce.number().optional(),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  appId: z.enum(['bcs', 'bnc', 'api']),
  type: z.enum(['subscription', 'coins']),
});

type ProductEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onProductUpdate: () => void;
};

export default function ProductEditModal({ isOpen, onOpenChange, product, onProductUpdate }: ProductEditModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        description: '',
        regularPrice: 0,
        discountedPrice: undefined,
        imageUrl: '',
        appId: 'bcs',
        type: 'subscription',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
    } else {
        form.reset({
            name: '',
            description: '',
            regularPrice: 0,
            discountedPrice: undefined,
            imageUrl: '',
            appId: 'bcs',
            type: 'subscription',
        });
    }
  }, [product, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        if (product && product.id) {
            await updateProduct(product.id, values);
            toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
        } else {
            await addProduct(values);
            toast({ title: 'Product Added', description: 'The new product has been successfully added.' });
        }
        onProductUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving product:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!product || !product.id) return;
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
                    <FormLabel>Description</FormLabel>
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
                        <FormLabel>Discounted Price (৳)</FormLabel>
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
                    <FormLabel>Image URL</FormLabel>
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
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an app" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {APPS.map(app => (
                                    <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
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
