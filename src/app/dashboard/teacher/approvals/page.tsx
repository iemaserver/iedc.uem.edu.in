import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Approvals | IEDC Dashboard',
  description: 'Manage student research paper and project approvals',
};

export default function ApprovalsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Approvals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Student research papers and projects pending your approval will appear here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
