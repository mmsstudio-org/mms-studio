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
import { Loader2, Mail, MapPin, Phone, Github, Linkedin, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSiteInfo } from '@/lib/firestore-service';
import type { SiteInfo } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import HelpCenterModal from './help-center-modal';

const XIcon = Twitter;
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
        <path fill="currentColor" d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4" />
    </svg>
);

const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
        <path fill="currentColor" d="m16.463 8.846l-1.09 6.979a.588.588 0 0 1-.894.407l-3.65-2.287a.588.588 0 0 1-.095-.923l3.03-2.904c.034-.032-.006-.085-.046-.061l-4.392 2.628a1.23 1.23 0 0 1-.87.153l-1.59-.307c-.574-.111-.653-.899-.114-1.122l8.502-3.515a.882.882 0 0 1 1.21.952" /><path fill="currentColor" fill-rule="evenodd" d="M12 1.706C6.315 1.706 1.706 6.315 1.706 12S6.315 22.294 12 22.294S22.294 17.685 22.294 12S17.685 1.706 12 1.706M3.47 12a8.53 8.53 0 1 1 17.06 0a8.53 8.53 0 0 1-17.06 0" clip-rule="evenodd" />
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
    const [isHelpOpen, setHelpOpen] = useState(false);

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

    return (
        <section id="contact" className="py-20 scroll-mt-20">
            
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
                                    <FormItem><FormLabel>Your Message*</FormLabel><FormControl><Textarea placeholder="Describe your project vision, key features, and any questions you have." {...field} rows={8} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="flex flex-col gap-4">
                                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Send Message
                                    </Button>
                                    <div className="text-xs text-center text-muted-foreground space-y-2">
                                        <p>This form is for project inquiries. We will contact you via email or phone as soon as possible.</p>
                                        <p>
                                            For product support or purchase issues, please use the{' '}
                                            <button type="button" onClick={() => setHelpOpen(true)} className="underline font-medium hover:text-accent">Help Center</button>
                                            {' '}for a faster response.
                                        </p>
                                    </div>
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
                                                <a href={`mailto:${siteInfo.email}`} className="text-muted-foreground break-all hover:text-accent">{siteInfo.email}</a>
                                            </div>
                                        </div>
                                    )}
                                    {siteInfo?.contactNumber && (
                                        <div className="flex items-start gap-4">
                                            <Phone className="h-6 w-6 text-accent mt-1" />
                                            <div>
                                                <h4 className="font-semibold">Call Us</h4>
                                                <a href={`tel:${siteInfo.contactNumber}`} className="text-muted-foreground hover:text-accent">{siteInfo.contactNumber}</a>
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
            <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
        </section>
    );
}
