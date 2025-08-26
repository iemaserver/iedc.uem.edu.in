import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ResearchPaperDashboard } from '@/components/research-paper/research-paper-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';

export default async function ResearchPaperPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

    const userRole = session.user.userType as "STUDENT" | "TEACHER" | "ADMIN";

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <ResearchPaperDashboard userRole={userRole} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}







