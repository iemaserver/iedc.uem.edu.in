import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'My Competitions | IEDC Dashboard',
  description: 'View your competition entries and results',
};

export default function MyCompetitionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Competitions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Competition Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your competition entries and results will be shown here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
