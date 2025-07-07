"use client";

import dynamicImport from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Dynamically import the ProfilePage component
const ProfilePage = dynamicImport(() => import('./ProfilePage'), {
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <p>Loading profile...</p>
    </div>
  ),
});

export default function DynamicProfilePage() {
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
      <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>Loading profile data...</p>
      </div>
    );
  }

  return <ProfilePage userData={userData} />;
}
