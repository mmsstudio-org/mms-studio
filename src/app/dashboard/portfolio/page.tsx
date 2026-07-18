'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/confirm-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  getAllPortfolioAdmin,
  deletePortfolioProject,
  updatePortfolioProject,
  updatePortfolioOrders,
} from '@/lib/firestore-service';
import type { PortfolioProject } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  GripVertical,
  Pencil,
  Trash2,
  Smartphone,
  Globe,
  FolderGit2,
  Star,
  Eye,
  EyeOff,
  PlusCircle,
  ArrowLeft,
  Loader2,
  Briefcase
} from 'lucide-react';

// Sortable Item Component
interface SortableRowProps {
  project: PortfolioProject;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus: (project: PortfolioProject) => void;
  onToggleFeatured: (project: PortfolioProject) => void;
  isUpdating: string | null;
}

function SortableProjectRow({
  project,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  isUpdating,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id! });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getProjectIcon = (type: 'app' | 'web' | 'both' | 'other') => {
    switch (type) {
      case 'app':
        return <Smartphone className="h-4 w-4 text-accent" />;
      case 'web':
        return <Globe className="h-4 w-4 text-accent" />;
      case 'both':
        return (
          <span className="flex items-center gap-0.5">
            <Globe className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground/60 text-[10px] select-none">+</span>
            <Smartphone className="h-4 w-4 text-accent" />
          </span>
        );
      default:
        return <FolderGit2 className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-md hover:border-primary/45 transition-colors ${
        isDragging ? 'shadow-2xl ring-2 ring-primary/30 border-primary' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-grow min-w-0">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 text-muted-foreground hover:text-accent rounded hover:bg-muted/30"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Thumbnail Preview */}
        {project.coverImageUrl && (
          <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-border/30 bg-muted shrink-0 hidden md:block">
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-heading font-semibold text-white truncate text-base hover:text-accent transition-colors">
              <Link href={`/portfolio/${project.slug}`} target="_blank">
                {project.title}
              </Link>
            </h3>
            <Badge variant="secondary" className="bg-primary/10 border-primary/20 text-primary dark:text-accent-foreground text-[10px] py-0.5">
              {getProjectIcon(project.projectType)}
              <span className="ml-1 uppercase tracking-wider">{project.projectType}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs font-body truncate max-w-xl">
            {project.shortDescription}
          </p>
        </div>
      </div>

      {/* Action / Badges Group */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        {/* Featured Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleFeatured(project)}
          disabled={isUpdating === project.id}
          className={`h-8 w-8 rounded-lg ${
            project.featured ? 'text-amber-500 hover:text-amber-400 bg-amber-500/10' : 'text-muted-foreground hover:text-white'
          }`}
          title={project.featured ? 'Featured (Click to unfeature)' : 'Mark as Featured'}
        >
          {isUpdating === project.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" fill={project.featured ? 'currentColor' : 'none'} />
          )}
        </Button>

        {/* Publish Status Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(project)}
          disabled={isUpdating === project.id}
          className={`h-8 min-w-[90px] font-semibold border-border/80 text-xs rounded-lg ${
            project.status === 'published'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-card/80 text-muted-foreground border-border hover:bg-muted/20'
          }`}
        >
          {isUpdating === project.id ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : project.status === 'published' ? (
            <Eye className="h-3.5 w-3.5 mr-1" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 mr-1" />
          )}
          <span className="capitalize">{project.status}</span>
        </Button>

        {/* Edit and Delete */}
        <div className="flex items-center border-l border-border/40 pl-3 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(project.id!)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white"
            title="Edit Project"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(project.id!, project.title)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Authentication gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllPortfolioAdmin();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch portfolio projects.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging 8px before activation (prevents accidental drags on click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    const reorderedList = arrayMove(projects, oldIndex, newIndex);
    // Update local state instantly for smooth performance
    setProjects(reorderedList);

    // Save sequence to Firestore in a batch write
    try {
      const orderedIds = reorderedList.map((p) => p.id!).filter(Boolean);
      await updatePortfolioOrders(orderedIds);
      toast({ title: 'Success', description: 'Project order saved successfully.' });
    } catch (error) {
      console.error('Failed to save project sequence:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Failed to update sorting order.' });
      // Restore previous order
      loadProjects();
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/portfolio/${id}/edit`);
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Project',
      description: `Are you sure you want to delete the project "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deletePortfolioProject(id);
      toast({ title: 'Success', description: 'Project deleted successfully.' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete project.' });
    }
  };

  const handleToggleStatus = async (project: PortfolioProject) => {
    if (!project.id) return;
    setIsUpdating(project.id);
    const newStatus = project.status === 'published' ? 'draft' : 'published';

    try {
      await updatePortfolioProject(project.id, { status: newStatus });
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      );
      toast({ title: 'Status Updated', description: `Project is now set to ${newStatus}.` });
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle status.' });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleFeatured = async (project: PortfolioProject) => {
    if (!project.id) return;
    setIsUpdating(project.id);
    const newFeatured = !project.featured;

    try {
      await updatePortfolioProject(project.id, { featured: newFeatured });
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, featured: newFeatured } : p))
      );
      toast({
        title: 'Status Updated',
        description: newFeatured ? 'Project marked as Featured.' : 'Project removed from Featured.',
      });
    } catch (err) {
      console.error('Failed to update featured status:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle featured status.' });
    } finally {
      setIsUpdating(null);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      {/* Header Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-accent transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold font-['Orbitron'] tracking-wide">Manage Portfolio</h1>
          <p className="text-muted-foreground mt-1 font-body">
            Add new projects, configure links, and drag rows to adjust the priority order on the public site.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/95 text-white font-semibold">
          <Link href="/dashboard/portfolio/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add Project
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-accent animate-spin" />
          <p className="text-muted-foreground font-body">Loading portfolio...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-2 border-dashed bg-card/15 border-border/50 text-center py-20 max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold font-heading text-white">No projects found</h3>
            <p className="text-muted-foreground mt-2 font-body max-w-xs">
              Get started by creating your first showcase project!
            </p>
            <Button asChild className="mt-6 bg-primary hover:bg-primary/95">
              <Link href="/dashboard/portfolio/new">Add First Project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Drag & Drop Context */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={projects.map((p) => p.id!)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {projects.map((project) => (
                  <SortableProjectRow
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onToggleFeatured={handleToggleFeatured}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="text-center text-xs text-muted-foreground mt-4 font-body">
            💡 Tap and hold the drag handle <GripVertical className="inline h-3 w-3" /> next to a project, then slide to rearrange.
          </div>
        </div>
      )}
    </div>
  );
}
