'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMarketingPage } from '@/ai/flows/generate-marketing-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';

const formSchema = z.object({
  appName: z.string().min(3, 'App name must be at least 3 characters.'),
  appDescription: z.string().min(20, 'Description must be at least 20 characters.'),
  targetAudience: z.string().min(10, 'Target audience must be at least 10 characters.'),
  heroImage: z.any().refine((file) => file?.length == 1, 'Hero image is required.'),
});

type GenerateMarketingPageOutput = {
  marketingPageContent: string;
  suggestedLayout: string;
};

export default function AiPageGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateMarketingPageOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: '',
      appDescription: '',
      targetAudience: '',
    },
  });

  const fileRef = form.register('heroImage');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);

    try {
      const file = values.heroImage[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result as string;
        const response = await generateMarketingPage({
          ...values,
          heroImage: base64Image,
          exampleLayouts: ['Minimalist', 'Corporate', 'Playful', 'Futuristic'],
        });
        setResult(response);
        toast({
          title: 'Page Generated Successfully!',
          description: `AI suggests the "${response.suggestedLayout}" layout.`,
        });
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({
          variant: 'destructive',
          title: 'Error Reading File',
          description: 'Could not process the uploaded image.',
        });
      };
    } catch (error) {
      console.error('Error generating page:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" />
            AI Marketing Page Generator
          </CardTitle>
          <CardDescription>
            Describe your app and upload a hero image to generate a custom marketing page instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., QuantumLeap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech enthusiasts and developers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="appDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your app's features and benefits..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroImage"
                render={() => (
                  <FormItem>
                    <FormLabel>Hero Image</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Page
              </Button>
            </form>
          </Form>

          {isLoading && (
            <div className="mt-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">AI is crafting your page...</p>
            </div>
          )}

          {result && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4">Generated Page Preview</h3>
              <p className="mb-4 text-muted-foreground">
                Suggested Layout: <span className="font-semibold text-accent">{result.suggestedLayout}</span>
              </p>
              <div
                className="prose prose-invert max-w-none p-6 border rounded-lg bg-background"
                dangerouslySetInnerHTML={{ __html: result.marketingPageContent }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
