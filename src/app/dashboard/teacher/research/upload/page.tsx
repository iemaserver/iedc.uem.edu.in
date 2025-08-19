import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Upload Research | IEDC Dashboard',
  description: 'Upload and manage your research work',
};

export default function UploadResearchPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Research</h1>
      <Card>
        <CardHeader>
          <CardTitle>Research Upload Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Research work upload functionality will be available here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
