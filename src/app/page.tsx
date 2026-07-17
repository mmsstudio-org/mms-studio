"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getFeatures, getSiteInfo, getRecentPublishedBlogs } from "@/lib/firestore-service";
import type { Feature, SiteInfo, Blog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Globe,
  Code,
  ShieldCheck,
  Cloud,
  Database,
  Bot,
  ShoppingBag,
  Briefcase,
  BookOpen,
  Calendar,
  ArrowRight,
  User,
} from "lucide-react";
import Image from "next/image";
import ContactSection from "./_components/contact-section";

const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.HelpCircle className={className} />;
  }
  return <LucideIcon className={className} />;
};

const services = [
  {
    icon: Globe,
    title: "Web Development",
    description:
      "Modern, responsive websites and complex web applications tailored to your needs.",
  },
  {
    icon: Smartphone,
    title: "Android App Development",
    description:
      "Custom native Android applications built for performance and user engagement.",
  },
  {
    icon: Code,
    title: "API Development",
    description:
      "Robust and secure APIs to power your mobile and web applications.",
  },
  {
    icon: Database,
    title: "Database Design",
    description:
      "Efficient and scalable database architecture for optimal performance.",
  },
  {
    icon: Cloud,
    title: "Cloud Setup",
    description:
      "Scalable and reliable cloud infrastructure setup and management.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    description:
      "Implementing top-tier security measures to protect your digital assets.",
  },
  {
    icon: Bot,
    title: "Robotics",
    description:
      "Innovative robotics solutions and automation for various industries.",
  },
];

export default function Home() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [fetchedFeatures, fetchedSiteInfo, fetchedBlogs] = await Promise.all([
        getFeatures(),
        getSiteInfo(),
        getRecentPublishedBlogs(3),
      ]);
      setFeatures(fetchedFeatures);
      setSiteInfo(fetchedSiteInfo);
      setRecentBlogs(fetchedBlogs);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center py-20">
        {loading ? (
          <>
            <Skeleton className="h-20 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto mt-4" />
            <Skeleton className="h-12 w-48 mx-auto mt-8" />
          </>
        ) : (
          <>
            <h1
              className="text-5xl md:text-7xl font-['Orbitron'] font-black mb-6 animate-float"
            >
              <span className="gradient-text">{siteInfo?.webName || "MMS Studio"}</span>
              <br /> <span className="neon-text">of Apps & Services</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {siteInfo?.webDescription ||
                "Your Gateway to the Future of Digital Assets. Explore our services and tools designed for the next generation of the web."}
            </p>
            <div className="flex justify-center gap-4">
              <div className="futuristic-glowing-button-container">
                 <Link href="/shop" className="futuristic-glowing-button">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Explore The Shop
                  </Link>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-['Orbitron'] font-bold neon-text">
            Why Choose Us?
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            We deliver cutting-edge solutions with a focus on quality, security,
            and performance. Our team is dedicated to bringing your vision to
            life with the latest technologies.
            <a
              href="https://sabbirmms.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-semibold"
            >
              {" "}
              See more
            </a>{" "}
            of our work.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <>
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </>
          ) : (
            features.map((feature) => (
              <Card
                key={feature.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 text-center"
              >
                <CardHeader className="items-center">
                  {feature.icon && feature.icon.startsWith('http') ? (
                      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                        <Image src={feature.icon} alt={feature.title} width={32} height={32} className="object-contain" />
                      </div>
                    ) : (
                      <Icon name={feature.icon} className="h-10 w-10 text-accent" />
                  )}
                  <CardTitle className="mt-4 text-2xl font-bold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-['Orbitron'] font-bold neon-text">
            Our Services
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-border/50 text-center flex flex-col"
            >
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <service.icon className="h-10 w-10 text-accent" />
                </div>
                <CardTitle className="mt-4 text-2xl font-bold">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Latest from the Blog Section */}
      {recentBlogs.length > 0 && (
        <section className="py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-['Orbitron'] font-bold neon-text">
              Latest from the Blog
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
              Stay updated with our latest tutorials, developer news, and insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-8">
            {recentBlogs.map((blog) => {
              const formattedDate = format(new Date(blog.publishedAt), 'MMM dd, yyyy');
              return (
                <Card
                  key={blog.id}
                  className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1"
                >
                  {blog.coverImageUrl && (
                    <div className="relative w-full aspect-video">
                      <Image
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {blog.author}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl font-bold leading-snug hover:text-accent transition-colors">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow pb-4">
                    <p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">
                      {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>/g, '').slice(0, 120) + '...' : '')}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="ghost" className="p-0 text-accent hover:text-accent/80 hover:bg-transparent">
                      <Link href={`/blog/${blog.slug}`} className="flex items-center gap-2 font-semibold">
                        Read Article
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-center">
            <div className="futuristic-glowing-button-container">
              <Link href="/blog" className="futuristic-glowing-button">
                  <BookOpen className="mr-2 h-5 w-5" />
                  View All Posts
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="admin" className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-['Orbitron'] font-bold mb-8 neon-text">
            Our Projects & Portfolio
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our developer portfolio to discover our innovative projects,
            apps, and digital solutions.
          </p>
          <div className="flex justify-center">
            <div className="futuristic-glowing-button-container">
              <Link href="https://sabbirmms.github.io" target="_blank" className="futuristic-glowing-button">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Visit Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
