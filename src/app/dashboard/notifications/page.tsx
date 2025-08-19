import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Notifications | IEDC Dashboard',
  description: 'View your notifications and updates',
};

export default function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your notifications will appear here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
