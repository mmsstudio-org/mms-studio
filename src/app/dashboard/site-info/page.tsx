'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { SiteInfo, Feature } from '@/lib/types';
import { getSiteInfo, updateSiteInfo, getFeatures, addFeature, updateFeature, deleteFeature } from '@/lib/firestore-service';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const siteInfoSchema = z.object({
  webName: z.string().min(3, 'Website name must be at least 3 characters.'),
  webDescription: z.string().min(10, 'Description must be at least 10 characters.'),
  bkashNumber: z.string().min(11, 'bKash number must be at least 11 characters.'),
  bkashQrCodeUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  paymentApiBaseUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  paymentApiKey: z.string().optional(),
  couponApiBaseUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  couponApiKey: z.string().optional(),
});

const featureSchema = z.object({
  id: z.string().optional(),
  icon: z.string().min(1, 'Icon name is required.'),
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(10, 'Description is required.'),
});

const formSchema = z.object({
  features: z.array(featureSchema),
});


export default function SiteInfoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeatureSubmitting, setIsFeatureSubmitting] = useState<string | null>(null);

  const siteInfoForm = useForm<z.infer<typeof siteInfoSchema>>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      webName: '',
      webDescription: '',
      bkashNumber: '',
      bkashQrCodeUrl: '',
      paymentApiBaseUrl: '',
      paymentApiKey: '',
      couponApiBaseUrl: '',
      couponApiKey: '',
    },
  });

  const featuresForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      features: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: featuresForm.control,
    name: 'features',
    keyName: 'formId',
  });
  
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    const [siteInfo, featuresData] = await Promise.all([getSiteInfo(), getFeatures()]);
    siteInfoForm.reset(siteInfo);
    featuresForm.reset({ features: featuresData });
    setLoadingData(false);
  }, [siteInfoForm, featuresForm]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if(user) {
        fetchAllData();
    }
  }, [user, authLoading, router, fetchAllData]);

  const handleSiteInfoSubmit = async (values: z.infer<typeof siteInfoSchema>) => {
    setIsSubmitting(true);
    try {
      await updateSiteInfo(values);
      toast({ title: 'Success', description: 'Site information updated successfully.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update site information.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureSave = async (featureData: Feature, index: number) => {
    setIsFeatureSubmitting(featureData.id || `new-${index}`);
    try {
      if (featureData.id) {
        await updateFeature(featureData.id, featureData);
        toast({ title: 'Success', description: `Feature "${featureData.title}" updated.` });
      } else {
        const newId = await addFeature(featureData);
        update(index, { ...featureData, id: newId });
        toast({ title: 'Success', description: `Feature "${featureData.title}" added.` });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save feature.' });
    } finally {
      setIsFeatureSubmitting(null);
    }
  }

  const handleFeatureDelete = async (featureId: string, index: number) => {
    setIsFeatureSubmitting(featureId);
    try {
        await deleteFeature(featureId);
        remove(index);
        toast({ title: 'Success', description: 'Feature deleted.'});
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete feature.' });
    } finally {
        setIsFeatureSubmitting(null);
    }
  }
  
  const addNewFeature = () => {
    append({ id: '', icon: 'Zap', title: '', description: '' });
  }

  if (authLoading || loadingData) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/4 mb-8" />
        <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Manage Site Information</h1>
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>General, Payment & API</CardTitle>
            <CardDescription>Update your website's main details, bKash info, and API configurations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...siteInfoForm}>
              <form onSubmit={siteInfoForm.handleSubmit(handleSiteInfoSubmit)} className="space-y-6">
                <FormField
                  control={siteInfoForm.control}
                  name="webName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={siteInfoForm.control}
                  name="webDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={siteInfoForm.control}
                  name="bkashNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>bKash Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={siteInfoForm.control}
                  name="bkashQrCodeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>bKash QR Code Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <h3 className="text-lg font-semibold pt-4 border-t">API Settings</h3>
                <FormField
                  control={siteInfoForm.control}
                  name="paymentApiBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment API Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://your-payment-api.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={siteInfoForm.control}
                  name="paymentApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={siteInfoForm.control}
                  name="couponApiBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon API Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://your-coupon-api.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={siteInfoForm.control}
                  name="couponApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save All Info
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Homepage Features</CardTitle>
                        <CardDescription>Manage the features displayed on your homepage.</CardDescription>
                    </div>
                    <Button onClick={addNewFeature}><PlusCircle className="mr-2 h-4 w-4" /> Add Feature</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <Form {...featuresForm}>
                {fields.map((field, index) => {
                  const featureSubmitting = isFeatureSubmitting === (field.id || `new-${index}`);
                  return (
                    <form 
                        key={field.formId}
                        onSubmit={featuresForm.handleSubmit(() => handleFeatureSave(featuresForm.getValues().features[index], index))} 
                        className="p-4 border rounded-lg space-y-4 relative"
                    >
                         <FormField
                            control={featuresForm.control}
                            name={`features.${index}.icon`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Icon Name (from Lucide)</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={featuresForm.control}
                            name={`features.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={featuresForm.control}
                            name={`features.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="flex gap-2">
                             <Button type="submit" disabled={featureSubmitting}>
                                {featureSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Feature
                            </Button>
                            {field.id && (
                                <Button type="button" variant="destructive" onClick={() => handleFeatureDelete(field.id!, index)} disabled={featureSubmitting}>
                                    {featureSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </form>
                 )})}
               </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
