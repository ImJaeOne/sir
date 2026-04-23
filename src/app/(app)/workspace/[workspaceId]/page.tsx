import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { workspaceKeys } from '@/hooks/workspace/workspaceKeys';
import { getWorkspaceServer } from '@/lib/api/workspaceApi.server';
import { WorkspaceDetailClient } from './WorkspaceDetailClient';

interface WorkspaceDetailPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const { workspaceId } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspaceServer(workspaceId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceDetailClient workspaceId={workspaceId} />
    </HydrationBoundary>
  );
}
