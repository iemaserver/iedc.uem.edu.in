import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadOngoingProjectForm } from '@/components/ongoing-projects/upload-ongoing-project-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function UploadOngoingProjectPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Ongoing Project</h1>
        <p className="text-muted-foreground">
          Submit your ongoing project for review and collaboration. You can select faculty advisors to guide your work.
        </p>
      </div>

      <Suspense fallback={<UploadFormSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Fill in the details below to upload your ongoing project. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadOngoingProjectForm />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}

function UploadFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}