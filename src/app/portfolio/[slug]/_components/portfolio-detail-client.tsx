'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import type { PortfolioProject } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { useAuth } from '@/hooks/use-auth';
import {
  Calendar,
  User,
  Briefcase,
  Globe,
  Github,
  ArrowLeft,
  Smartphone,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Pencil
} from 'lucide-react';

interface PortfolioDetailClientProps {
  project: PortfolioProject;
}

// Custom SVGs for App Store and Play Store
function AppStoreIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.1 16.67C20.08 16.74 19.67 18.11 18.71 19.5M15.97 4.17C16.63 3.37 17.07 2.28 16.95 1C15.85 1.04 14.51 1.73 13.73 2.64C13.07 3.41 12.49 4.52 12.64 5.78C13.87 5.87 15.12 5.17 15.97 4.17Z" />
    </svg>
  );
}

function PlayStoreIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.609 1.814L13.784 12L3.609 22.186C3.253 21.91 3 21.362 3 20.598V3.402C3 2.638 3.253 2.09 3.609 1.814ZM4.708 1.109C4.943 1.036 5.231 1.084 5.562 1.25L17.755 7.37L14.877 10.248L4.708 1.109ZM15.973 11.344L18.85 8.467L20.892 9.493C21.63 9.864 22 10.428 22 11C22 11.572 21.63 12.136 20.892 12.507L18.85 13.533L15.973 11.344ZM4.708 22.891L14.877 13.752L17.755 16.63L5.562 22.75C5.231 22.916 4.943 22.964 4.708 22.891Z" />
    </svg>
  );
}

// Logic to determine if store link is apple or play store
function getStoreLinkType(url: string): 'apple' | 'google' | 'generic' {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('apps.apple.com')) {
    return 'apple';
  }
  if (lowercaseUrl.includes('play.google.com') || lowercaseUrl.includes('market://')) {
    return 'google';
  }
  return 'generic';
}

function getProjectIcon(type: 'app' | 'web' | 'both' | 'other') {
  switch (type) {
    case 'app':
      return <Smartphone className="h-5 w-5 text-accent" />;
    case 'web':
      return <Globe className="h-5 w-5 text-accent" />;
    case 'both':
      return (
        <span className="flex items-center gap-0.5">
          <Globe className="h-5 w-5 text-accent" />
          <span className="text-muted-foreground/60 text-xs select-none">+</span>
          <Smartphone className="h-5 w-5 text-accent" />
        </span>
      );
    default:
      return <FolderGit2 className="h-5 w-5 text-accent" />;
  }
}

function getProjectTypeLabel(type: 'app' | 'web' | 'both' | 'other') {
  switch (type) {
    case 'app':
      return 'Mobile Application';
    case 'web':
      return 'Web Application';
    case 'both':
      return 'Web & App';
    default:
      return 'Software Project';
  }
}

export default function PortfolioDetailClient({ project }: PortfolioDetailClientProps) {
  const { user } = useAuth();
  // Combine cover image and gallery images
  const allImages = [project.coverImageUrl, ...(project.galleryImageUrls || [])].filter(Boolean);
  const isSlider = allImages.length > 1;

  // Sanitized view content
  const sanitizedDescription = DOMPurify.sanitize(project.description, { ADD_ATTR: ['style'] });

  // Check if any link exists
  const hasLinks = !!(project.liveUrl || project.githubUrl || project.storeUrl);

  return (
    <div className="container mx-auto py-10 max-w-6xl px-4">
      {/* Header Bar with Admin Edit Option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to portfolio list
        </Link>
        {user && (
          <Button asChild variant="outline" className="border-primary/40 hover:bg-primary/10 text-xs h-9 rounded-lg self-start sm:self-auto">
            <Link href={`/dashboard/portfolio/${project.id}/edit`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-accent" /> Edit Project
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side - Image Slider/Gallery (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {isSlider ? (
            <div className="relative group">
              <Carousel className="w-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/10">
                <CarouselContent>
                  {allImages.map((imageUrl, idx) => (
                    <CarouselItem key={idx} className="relative w-full aspect-video">
                      <Image
                        src={imageUrl}
                        alt={`${project.title} - Preview ${idx + 1}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 680px"
                        className="object-cover"
                        priority={idx === 0}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 border-none text-white h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronLeft className="h-5 w-5" />
                </CarouselPrevious>
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 border-none text-white h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronRight className="h-5 w-5" />
                </CarouselNext>
              </Carousel>
            </div>
          ) : (
            <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border/50 bg-card/10">
              <Image
                src={project.coverImageUrl}
                alt={project.title}
                fill
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {/* Right Side - Project Info (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/95 text-white font-semibold text-[11px] tracking-wider uppercase flex items-center gap-1.5 py-1">
                {getProjectIcon(project.projectType)}
                <span>{getProjectTypeLabel(project.projectType)}</span>
              </Badge>
              {project.featured && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-bold tracking-wider uppercase text-[11px] py-1">
                  ⭐ Featured
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-['Orbitron'] font-black leading-tight tracking-tight text-foreground">
              {project.title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed font-body">
              {project.shortDescription}
            </p>
          </div>

          {/* Project Details Box */}
          {(project.client || project.role || project.timeline) && (
            <div className="p-5 rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm space-y-3 text-sm font-body">
              <h3 className="font-heading text-xs font-semibold text-foreground tracking-widest uppercase border-b border-border/40 pb-2 mb-3">
                Project Overview
              </h3>
              {project.client && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-accent" /> Client</span>
                  <span className="font-semibold text-foreground text-right">{project.client}</span>
                </div>
              )}
              {project.role && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4 text-accent" /> Role</span>
                  <span className="font-semibold text-foreground text-right">{project.role}</span>
                </div>
              )}
              {project.timeline && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4 text-accent" /> Timeline</span>
                  <span className="font-semibold text-foreground text-right">{project.timeline}</span>
                </div>
              )}
            </div>
          )}

          {/* Tech Stack Tags */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-heading text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="bg-primary/10 border-primary/25 text-primary dark:text-accent-foreground text-xs font-medium px-2.5 py-0.5"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Links / CTAs */}
          {hasLinks && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {project.liveUrl && (
                <Button asChild className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold">
                  <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <Globe className="h-4 w-4" /> Live Preview
                  </Link>
                </Button>
              )}
              
              {project.storeUrl && (
                <Button asChild variant="outline" className="flex-1 border-primary/30 text-foreground dark:text-white hover:bg-primary/10 hover:text-primary dark:hover:text-white font-semibold">
                  <Link href={project.storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    {getStoreLinkType(project.storeUrl) === 'apple' && <AppStoreIcon className="h-4 w-4 text-accent" />}
                    {getStoreLinkType(project.storeUrl) === 'google' && <PlayStoreIcon className="h-4 w-4 text-accent" />}
                    {getStoreLinkType(project.storeUrl) === 'generic' && <Globe className="h-4 w-4 text-accent" />}
                    Store Download
                  </Link>
                </Button>
              )}

              {project.githubUrl && (
                <Button asChild variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/30">
                  <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <Github className="h-4 w-4" /> Code
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description Section */}
      {project.description && (
        <div className="mt-16 pt-8 border-t border-border/50">
          <h2 className="text-2xl font-bold font-['Orbitron'] text-foreground mb-6 tracking-wide">
            Project Case Study & Details
          </h2>
          <div
            className="blog-content w-full font-body leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        </div>
      )}
    </div>
  );
}
