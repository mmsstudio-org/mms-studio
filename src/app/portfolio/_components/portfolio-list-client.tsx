'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublishedPortfolio } from '@/lib/firestore-service';
import type { PortfolioProject } from '@/lib/types';
import { Smartphone, Globe, FolderGit2, Calendar, ArrowRight, Briefcase } from 'lucide-react';

// Map project types to icons
function getProjectIcon(type: 'app' | 'web' | 'both' | 'other') {
  switch (type) {
    case 'app':
      return <Smartphone className="h-3.5 w-3.5 text-accent" />;
    case 'web':
      return <Globe className="h-3.5 w-3.5 text-accent" />;
    case 'both':
      return (
        <span className="flex items-center gap-0.5">
          <Globe className="h-3.5 w-3.5 text-accent" />
          <span className="text-muted-foreground/60 text-[10px] select-none">+</span>
          <Smartphone className="h-3.5 w-3.5 text-accent" />
        </span>
      );
    default:
      return <FolderGit2 className="h-3.5 w-3.5 text-accent" />;
  }
}

function getProjectTypeLabel(type: 'app' | 'web' | 'both' | 'other') {
  switch (type) {
    case 'app':
      return 'Mobile App';
    case 'web':
      return 'Web App';
    case 'both':
      return 'Web & App';
    default:
      return 'Project';
  }
}

export default function PortfolioListClient() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const list = await getPublishedPortfolio();
        setProjects(list);
      } catch (error) {
        console.error("Failed to load portfolio projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black mb-4 tracking-wide uppercase">
            <span className="gradient-text">Our Portfolio</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body">
            A showcase of our developer tools, apps, client work, and high-performance digital projects.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
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
              <CardFooter className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black mb-4 tracking-wide uppercase">
          <span className="gradient-text">Our Portfolio</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          A showcase of our developer tools, apps, client work, and high-performance digital projects.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card/20 border-border/50 max-w-lg mx-auto">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold font-heading">No projects published</h3>
          <p className="text-muted-foreground mt-2 font-body">
            Check back soon as we document our latest work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col overflow-hidden transition-all duration-300 border-primary shadow-md -translate-y-1 h-full bg-card/40 backdrop-blur-sm hover:border-border/50 hover:shadow-none hover:translate-y-0"
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
                <CardTitle className="text-xl font-bold leading-snug hover:text-accent transition-colors font-heading text-foreground line-clamp-2">
                  <Link href={`/portfolio/${project.slug}`}>{project.title}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 text-sm text-muted-foreground mt-2 font-body">
                  {project.shortDescription || ""}
                </CardDescription>
              </CardHeader>
              
              {project.techStack && project.techStack.length > 0 && (
                <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="secondary" className="bg-primary/10 border-primary/20 text-primary dark:text-accent-foreground text-[10px] font-medium transition-colors hover:bg-muted/50 hover:text-muted-foreground hover:border-border/50">
                      {tech}
                    </Badge>
                  ))}
                  {project.techStack.length > 4 && (
                    <Badge variant="secondary" className="bg-muted border-muted-foreground/20 text-muted-foreground text-[10px] font-medium">
                      +{project.techStack.length - 4} more
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
                <Link href={`/portfolio/${project.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-foreground transition-colors">
                  Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
