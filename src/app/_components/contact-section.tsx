'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2, Mail, MapPin, Phone, Github, Linkedin, Twitter, Instagram, Facebook, Youtube } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSiteInfo } from '@/lib/firestore-service';
import type { SiteInfo } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.6.35.2.16.32.34.4.55.12.3.18.6.18.98 0 .4-.1.78-.33 1.13-.23.35-.55.64-1 .85-.45.2-1 .3-1.6.3-.58 0-1.15-.1-1.7-.34-.55-.23-1.1-.55-1.63-.93-.53-.38-1.03-.8-1.5-1.25-.47-.45-.9-1-1.28-1.5s-.7-1-1-1.5c-.3-.5-.56-.98-.78-1.45-.22-.47-.38-.9-.42-1.3-.04-.4.04-.8.2-1.15.17-.35.4-.64.7-.84.3-.2.6-.3.9-.3.3 0 .6.04.8.13.2.1.35.2.45.3s.18.2.2.34c.03.14.02.28 0 .42-.02.14-.08.28-.17.4s-.18.23-.28.34c-.1.1-.2.2-.3.3s-.18.17-.25.24c-.07.07-.12.13-.15.18-.03.05-.05.1-.05.16 0 .06.02.12.06.18.04.06.1.13.18.2.08.07.18.14.28.2.1.08.23.15.35.23.12.08.24.14.35.18.1.04.2.07.28.1.08.03.15.04.2.04.05 0 .1-.02.15-.05.05-.03.1-.08.15-.14.05-.06.1-.12.14-.18.04-.06.08-.1.1-.13h.02z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
    </svg>
);
const TelegramIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 2 2 8.67l6.16 2.16 2.16 6.16L22 2Zm-6.53 8.87-5.54 3.53-1.4-4.59 9.38-6.1-2.44 7.16Z" />
    </svg>
);


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().optional(),
  subject: z.string().min(3, { message: 'Subject is required.' }),
  budget: z.string().optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export default function ContactSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteInfo().then(info => {
      setSiteInfo(info);
      setLoading(false);
    });
  }, []);

  const socialLinks = !siteInfo ? [] : [
    { href: siteInfo.githubUrl, icon: Github, label: "GitHub" },
    { href: siteInfo.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { href: siteInfo.xUrl, icon: XIcon, label: "X" },
    { href: siteInfo.instagramUrl, icon: Instagram, label: "Instagram" },
    { href: siteInfo.facebookUrl, icon: Facebook, label: "Facebook" },
    { href: siteInfo.youtubeUrl, icon: Youtube, label: "YouTube" },
    { href: siteInfo.whatsappUrl, icon: WhatsAppIcon, label: "WhatsApp" },
    { href: siteInfo.telegramUrl, icon: TelegramIcon, label: "Telegram" },
  ].filter(link => link.href);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      budget: '',
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("access_key", process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "");
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("phone", values.phone || 'N/A');
    formData.append("subject", `Project Inquiry: ${values.subject}`);
    formData.append("budget", values.budget || 'Not Specified');
    formData.append("message", values.message);
    formData.append("from_name", "MMS Studio Project Form");

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            toast({
                title: 'Message Sent!',
                description: 'Thank you for contacting us. We will get back to you shortly.',
            });
            form.reset();
        } else {
            console.error("Error submitting form:", data);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: data.message || 'An unexpected error occurred.',
            });
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'An unexpected error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  return (
    <section id="contact" className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-['Orbitron'] font-bold neon-text">Get in Touch</h2>
        <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Have a project in mind? We'd love to hear from you. Let's build something amazing together.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="text-3xl font-['Orbitron']">Let's Build Your Vision</CardTitle>
                <CardDescription>Fill out the form and we'll contact you to discuss your project.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Name*</FormLabel><FormControl><Input placeholder="Your Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email*</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+880 1..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="budget" render={({ field }) => (
                                <FormItem><FormLabel>Budget (Optional)</FormLabel><FormControl><Input placeholder="e.g., $5,000 - $10,000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name="subject" render={({ field }) => (
                            <FormItem><FormLabel>Subject*</FormLabel><FormControl><Input placeholder="e.g., E-commerce Website, Android App" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="message" render={({ field }) => (
                            <FormItem><FormLabel>Your Message*</FormLabel><FormControl><Textarea placeholder="Describe your project vision, key features, and any questions you have." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex flex-col gap-4">
                            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Submit Query
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">We will contact you via your provided email or phone number as soon as possible.</p>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <div className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <CardTitle className="text-2xl font-['Orbitron']">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-2/3" />
                        </div>
                    ) : (
                        <>
                        {siteInfo?.location && (
                            <div className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-accent mt-1" />
                                <div>
                                    <h4 className="font-semibold">Our Location</h4>
                                    <p className="text-muted-foreground">{siteInfo.location}</p>
                                </div>
                            </div>
                        )}
                         {siteInfo?.email && (
                            <div className="flex items-start gap-4">
                                <Mail className="h-6 w-6 text-accent mt-1" />
                                <div>
                                    <h4 className="font-semibold">Email Us</h4>
                                    <p className="text-muted-foreground break-all cursor-pointer hover:text-accent" onClick={() => copyToClipboard(siteInfo.email!, 'Email')}>{siteInfo.email}</p>
                                </div>
                            </div>
                        )}
                        {siteInfo?.contactNumber && (
                           <div className="flex items-start gap-4">
                                <Phone className="h-6 w-6 text-accent mt-1" />
                                <div>
                                    <h4 className="font-semibold">Call Us</h4>
                                    <p className="text-muted-foreground cursor-pointer hover:text-accent" onClick={() => copyToClipboard(siteInfo.contactNumber!, 'Phone number')}>{siteInfo.contactNumber}</p>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </CardContent>
            </Card>

            {loading ? <Skeleton className="h-48 w-full" /> : (
                <>
                {siteInfo?.googleMapsUrl && (
                    <div className="aspect-video overflow-hidden rounded-lg border">
                        <iframe
                            src={siteInfo.googleMapsUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Google Maps Location"
                        ></iframe>
                    </div>
                )}

                {socialLinks.length > 0 && (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-2xl font-['Orbitron']">Connect With Us</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                            {socialLinks.map(link => (
                                <Button asChild variant="outline" size="icon" key={link.label}>
                                    <Link href={link.href!} target="_blank" rel="noopener noreferrer">
                                        <link.icon />
                                        <span className="sr-only">{link.label}</span>
                                    </Link>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                )}
                </>
            )}
             <p className="text-center text-muted-foreground italic">
                We believe in building strong partnerships through transparent communication and a commitment to excellence. Your trust is our most valued asset.
            </p>
        </div>
      </div>
    </section>
  );
}
