import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Statistics | Admin Dashboard',
  description: 'View comprehensive system statistics and analytics',
};

export default function AdminStatsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">System Statistics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Comprehensive system statistics and analytics will be displayed here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
