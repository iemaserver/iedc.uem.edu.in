import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'My Achievements | IEDC Dashboard',
  description: 'View your achievements and milestones',
};

export default function MyAchievementsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Achievements</h1>
      <Card>
        <CardHeader>
          <CardTitle>Achievements & Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your achievements and accomplishments will be displayed here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
