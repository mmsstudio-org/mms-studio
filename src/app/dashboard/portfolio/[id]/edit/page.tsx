import { notFound } from 'next/navigation';
import { getPortfolioProject } from '@/lib/firestore-service';
import EditPortfolioClient from './edit-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const project = await getPortfolioProject(id);

  if (!project) {
    notFound();
  }

  return <EditPortfolioClient project={project} />;
}
