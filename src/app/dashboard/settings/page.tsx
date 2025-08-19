import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Settings | IEDC Dashboard',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Account settings and preferences will be available here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
