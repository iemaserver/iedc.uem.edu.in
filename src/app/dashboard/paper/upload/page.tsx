import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadResearchPaperForm } from '@/components/research-paper/upload-research-paper-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function UploadResearchPaperPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Research Paper</h1>
        <p className="text-muted-foreground">
          Submit your research paper for review and publication. You can select faculty advisors to review your work.
        </p>
      </div>

      <Suspense fallback={<UploadFormSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Research Paper Details</CardTitle>
            <CardDescription>
              Fill in the details below to upload your research paper. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadResearchPaperForm />
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
