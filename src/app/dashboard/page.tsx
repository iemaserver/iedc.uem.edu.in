"use client";

import React, { useEffect, useState } from 'react'
import ProfilePage from './_dashboardElement/ProfilePage'
import DashboardOverview from './_dashboardElement/DashboardOverview'
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
   const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    if (status !== "loading" && session?.user?.id) {
      // Fetch user data only if authenticated and userData is not yet loaded
      const userDataFetch = async () => {
        try {
          // Assuming your API endpoint correctly handles the user ID
          const response = await fetch(`/api/user/${session.user.id}`);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          setUserData(data.user);
          console.log("User Data:", data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      userDataFetch();
    }
  }, [session]);
  
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DashboardOverview />
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          {!userData ? (
            <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
              <p>Loading profile data...</p>
            </div>
          ) : (
            <ProfilePage userData={userData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard
