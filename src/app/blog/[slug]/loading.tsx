import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function BlogDetailLoading() {
  return (
    <div className="container mx-auto py-10 max-w-4xl px-4 space-y-8">
      {/* Back Button */}
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 mb-4 select-none">
        <ArrowLeft className="h-4 w-4" /> Back to blog list
      </div>

      {/* Title & Metadata */}
      <div className="space-y-4">
        <Skeleton className="h-10 md:h-12 w-3/4 bg-muted" />
        
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-28 bg-muted/80" />
          <Skeleton className="h-4 w-24 bg-muted/80" />
        </div>

        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-16 bg-muted/80 rounded-full" />
          <Skeleton className="h-5 w-20 bg-muted/80 rounded-full" />
        </div>
      </div>

      {/* Cover Image */}
      <Skeleton className="w-full aspect-video rounded-xl bg-muted/60 border border-border/20 shadow-md" />

      {/* Excerpt */}
      <div className="p-4 border-l-4 border-accent/30 bg-muted/20 rounded-r-lg space-y-2">
        <Skeleton className="h-4 w-full bg-muted/80" />
        <Skeleton className="h-4 w-5/6 bg-muted/80" />
      </div>

      {/* Content paragraphs */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full bg-muted/50" />
        <Skeleton className="h-4 w-full bg-muted/50" />
        <Skeleton className="h-4 w-11/12 bg-muted/50" />
        <Skeleton className="h-4 w-4/5 bg-muted/50" />
        
        <div className="h-4" />

        <Skeleton className="h-4 w-full bg-muted/50" />
        <Skeleton className="h-4 w-11/12 bg-muted/50" />
        <Skeleton className="h-4 w-5/6 bg-muted/50" />
      </div>
    </div>
  );
}
