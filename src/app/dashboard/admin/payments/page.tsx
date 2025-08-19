import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Payments | Admin Dashboard',
  description: 'Manage payments and financial transactions',
};

export default function AdminPaymentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment management and financial transaction tracking will be available here. This page is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
