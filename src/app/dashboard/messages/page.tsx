import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Messages | IEDC Dashboard',
  description: 'View and manage your messages',
};

export default function MessagesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Message Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your messages and communications will appear here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
