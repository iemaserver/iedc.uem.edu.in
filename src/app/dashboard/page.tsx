import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DynamicDashboardOverview from './_dashboardElement/DynamicDashboardOverview';
import DynamicProfilePage from './_dashboardElement/DynamicProfilePage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DynamicDashboardOverview />
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <DynamicProfilePage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;


