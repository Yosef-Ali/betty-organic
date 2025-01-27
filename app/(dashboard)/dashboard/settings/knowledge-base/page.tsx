import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import KnowledgeBaseManagement from '@/components/settings/KnowledgeBaseManagement';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function KnowledgeBaseSettingsPage() {
  // Check auth and admin status
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard/profile');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
        <p className="text-muted-foreground">
          Manage help articles and support documentation
        </p>
      </div>
      <Separator />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-[200px]" />
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[100px] w-full" />
              ))}
            </div>
          </div>
        }
      >
        <KnowledgeBaseManagement />
      </Suspense>
    </div>
  );
}
