"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getFeatures, getSiteInfo, getRecentPublishedBlogs, getFeaturedPortfolio } from "@/lib/firestore-service";
import type { Feature, SiteInfo, Blog, PortfolioProject } from "@/lib/types";
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
  const [featuredProjects, setFeaturedProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [fetchedFeatures, fetchedSiteInfo, fetchedBlogs, fetchedProjects] = await Promise.all([
        getFeatures(),
        getSiteInfo(),
        getRecentPublishedBlogs(3),
        getFeaturedPortfolio(3).catch(() => []),
      ]);
      setFeatures(fetchedFeatures);
      setSiteInfo(fetchedSiteInfo);
      setRecentBlogs(fetchedBlogs);
      setFeaturedProjects(fetchedProjects);
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

      <section id="portfolio" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-['Orbitron'] font-bold mb-4 neon-text">
              Featured Projects
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body">
              Explore our developer portfolio to discover our innovative apps, custom web solutions, and tools.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="flex flex-col h-[400px]">
                  <Skeleton className="w-full aspect-video rounded-t-lg" />
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-28" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : featuredProjects.length === 0 ? (
            <div className="flex justify-center mt-8">
              <div className="futuristic-glowing-button-container">
                <Link href="/portfolio" className="futuristic-glowing-button">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Visit Portfolio
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-12">
                {featuredProjects.map((project) => {
                  const getProjectIcon = (type: 'app' | 'web' | 'other') => {
                    switch (type) {
                      case 'app':
                        return <Smartphone className="h-3.5 w-3.5 text-accent" />;
                      case 'web':
                        return <Globe className="h-3.5 w-3.5 text-accent" />;
                      default:
                        return <Code className="h-3.5 w-3.5 text-accent" />;
                    }
                  };
                  
                  const getProjectTypeLabel = (type: 'app' | 'web' | 'other') => {
                    switch (type) {
                      case 'app':
                        return 'Mobile App';
                      case 'web':
                        return 'Web App';
                      default:
                        return 'Project';
                    }
                  };

                  return (
                    <Card
                      key={project.id}
                      className="flex flex-col overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 h-full bg-card/40 border-border/50 backdrop-blur-sm"
                    >
                      {project.coverImageUrl && (
                        <div className="relative w-full aspect-video border-b border-border/30 overflow-hidden">
                          <Image
                            src={project.coverImageUrl}
                            alt={project.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 z-10 flex gap-2">
                            {project.featured && (
                              <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-semibold text-[10px] tracking-wider uppercase">
                                ⭐ Featured
                              </Badge>
                            )}
                            <Badge className="bg-primary/90 text-white font-semibold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                              {getProjectIcon(project.projectType)}
                              <span>{getProjectTypeLabel(project.projectType)}</span>
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3 flex-grow">
                        <CardTitle className="text-xl font-bold leading-snug hover:text-accent transition-colors font-heading text-white line-clamp-2">
                          <Link href={`/portfolio/${project.slug}`}>{project.title}</Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-3 text-sm text-muted-foreground mt-2 font-body">
                          {project.shortDescription || ""}
                        </CardDescription>
                      </CardHeader>
                      
                      {project.techStack && project.techStack.length > 0 && (
                        <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                          {project.techStack.slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="secondary" className="bg-primary/10 border-primary/20 text-primary dark:text-accent-foreground text-[10px] font-medium">
                              {tech}
                            </Badge>
                          ))}
                          {project.techStack.length > 3 && (
                            <Badge variant="secondary" className="bg-muted border-muted-foreground/20 text-muted-foreground text-[10px] font-medium">
                              +{project.techStack.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <CardFooter className="pt-3 border-t border-border/30 flex justify-between items-center bg-card/10">
                        {project.timeline ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-body">
                            <Calendar className="h-3.5 w-3.5 text-accent" />
                            {project.timeline}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link href={`/portfolio/${project.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-white transition-colors">
                          Details <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <div className="futuristic-glowing-button-container">
                  <Link href="/portfolio" className="futuristic-glowing-button">
                      <Briefcase className="mr-2 h-5 w-5" />
                      View All Projects
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
