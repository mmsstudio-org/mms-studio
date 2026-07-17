'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { addProduct, getApp, getApps } from '@/lib/firestore-service';
import { convertDriveUrl } from '@/app/dashboard/blogs/_components/blog-form';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { AppDetail } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  regularPrice: z.coerce.number().min(0, { message: 'Price must be at least 0.' }),
  discountedPrice: z.union([z.coerce.number().min(0), z.string().length(0)]).optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['subscription', 'coins']),
  coinAmount: z.coerce.number().optional(),
  subscriptionDays: z.coerce.number().optional(),
  appId: z.string().min(1, { message: 'Please select a category.' }),
});

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [apps, setApps] = useState<AppDetail[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
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
      appId: categoryId,
    },
  });

  const productType = form.watch('type');

  useEffect(() => {
    if (categoryId) {
      form.setValue('appId', categoryId);
    }
  }, [categoryId, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    
    async function fetchCategoryAndApps() {
      if (user && categoryId) {
        try {
          const cat = await getApp(categoryId);
          if (cat) {
            setCategoryName(cat.name);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Category not found.' });
            router.push('/dashboard/categories');
            return;
          }
          
          const list = await getApps();
          setApps(list);
        } catch (e) {
          console.error(e);
        }
      }
    }
    
    fetchCategoryAndApps();
  }, [user, authLoading, categoryId, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const discPrice = values.discountedPrice === '' ? undefined : Number(values.discountedPrice);
    const coinAmt = values.type === 'coins' ? values.coinAmount : 0;
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
      await addProduct(productPayload);
      toast({ title: 'Success', description: 'Product added successfully.' });
      router.push(`/dashboard/categories/${values.appId}/edit`);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/categories/${categoryId}/edit`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Edit Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-['Orbitron']">Add Product to {categoryName || 'Category'}</CardTitle>
          <CardDescription>Create a new purchase option or package plan.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Product
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
