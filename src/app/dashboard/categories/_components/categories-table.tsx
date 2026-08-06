'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirm } from '@/components/ui/confirm-provider';
import { useToast } from '@/hooks/use-toast';
import { deleteApp } from '@/lib/firestore-service';
import type { AppDetail } from '@/lib/types';
import { Trash2, Pencil, ExternalLink, Package } from 'lucide-react';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.Smartphone className={className} />;
  }
  return <LucideIcon className={className} />;
};

type CategoriesTableProps = {
  apps: AppDetail[];
  onDelete: (appId: string) => void;
};

export default function CategoriesTable({ apps, onDelete }: CategoriesTableProps) {
  const { toast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async (app: AppDetail) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      description: `Are you sure you want to delete the category "${app.name}" and all its products? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteApp(app.id);
      toast({ title: 'Success', description: 'Category deleted successfully.' });
      onDelete(app.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting category.' });
    }
  };

  if (apps.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        No app categories found. Click "Add New Category" to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Icon</TableHead>
            <TableHead>Category Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Package Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                {app.icon && app.icon.startsWith('http') ? (
                  <div className="relative h-8 w-8 rounded overflow-hidden border">
                    <Image src={app.icon} alt={app.name} fill className="object-cover" />
                  </div>
                ) : app.icon ? (
                  <Icon name={app.icon} className="h-7 w-7 text-accent" />
                ) : (
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-accent font-bold text-sm">
                    {app.name.charAt(0)}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-semibold">{app.name}</TableCell>
              <TableCell>
                <code className="text-xs px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                  {app.slug || 'no-slug'}
                </code>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {app.pkg || <span className="text-muted-foreground/50">None</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="icon" title="View Public Shop">
                    <Link href={`/shop/${app.slug || app.id}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="icon" title="Manage Products">
                    <Link href={`/dashboard/categories/${app.id}`}>
                      <Package className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="icon" title="Edit Category">
                    <Link href={`/dashboard/categories/${app.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(app)}
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}