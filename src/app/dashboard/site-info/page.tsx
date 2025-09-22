'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { SiteInfo, Feature } from '@/lib/types';
import { getSiteInfo, updateSiteInfo, getFeatures, deleteFeature } from '@/lib/firestore-service';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureEditModal from './_components/feature-edit-modal';
import { ConfirmationDialog } from '../purchases/_components/confirmation-dialog';
import * as LucideIcons from 'lucide-react';

const siteInfoSchema = z.object({
  webName: z.string().min(3, 'Website name must be at least 3 characters.'),
  webDescription: z.string().min(10, 'Description must be at least 10 characters.'),
  bkashNumber: z.string().min(11, 'bKash number must be at least 11 characters.'),
  bkashQrCodeUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const Icon = ({ name, className }: { name: string; className: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
        return <LucideIcons.HelpCircle className={className} />;
    }
    return <LucideIcon className={className} />;
};

export default function SiteInfoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isFeatureModalOpen, setFeatureModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);


  const siteInfoForm = useForm<z.infer<typeof siteInfoSchema>>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      webName: '',
      webDescription: '',
      bkashNumber: '',
      bkashQrCodeUrl: '',
    },
  });
  
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [siteInfo, featuresData] = await Promise.all([getSiteInfo(), getFeatures()]);
      if (siteInfo) {
        siteInfoForm.reset(siteInfo);
      }
      setFeatures(featuresData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch site data.'});
    } finally {
      setLoadingData(false);
    }
  }, [siteInfoForm, toast]);

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

  const handleAddNewFeature = () => {
    setSelectedFeature(null);
    setFeatureModalOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setSelectedFeature(feature);
    setFeatureModalOpen(true);
  };

  const handleDeleteFeature = (feature: Feature) => {
    setFeatureToDelete(feature);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFeature = async () => {
    if (!featureToDelete || !featureToDelete.id) return;
    try {
      await deleteFeature(featureToDelete.id);
      toast({ title: 'Success', description: 'Feature deleted successfully.' });
      fetchAllData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete feature.' });
    }
    setFeatureToDelete(null);
  };
  

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
    <>
      <div className="container py-10">
        <h1 className="text-4xl font-bold mb-8">Manage Site Information</h1>
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>General & Payment Info</CardTitle>
              <CardDescription>Update your website's main details and bKash payment information.</CardDescription>
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
                          <CardDescription className="mt-1">Manage the features displayed on your homepage.</CardDescription>
                      </div>
                      <Button onClick={handleAddNewFeature}><PlusCircle className="mr-2 h-4 w-4" /> Add Feature</Button>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No features yet. Add one to get started.</p>
                ) : (
                  features.map((feature) => (
                    <Card key={feature.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                          <Icon name={feature.icon} className="h-8 w-8 text-accent shrink-0" />
                          <div className="flex-grow">
                              <h4 className="font-bold">{feature.title}</h4>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                          <Button variant="outline" size="sm" onClick={() => handleEditFeature(feature)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteFeature(feature)}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
          </Card>
        </div>
      </div>
      <FeatureEditModal
        isOpen={isFeatureModalOpen}
        onOpenChange={setFeatureModalOpen}
        feature={selectedFeature}
        onFeatureUpdate={() => {
          setFeatureModalOpen(false);
          fetchAllData();
        }}
      />
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteFeature}
        title="Confirm Deletion"
        description={<p>Are you sure you want to delete the feature "{featureToDelete?.title}"? This cannot be undone.</p>}
        confirmText="Delete"
      />
    </>
  );
}
