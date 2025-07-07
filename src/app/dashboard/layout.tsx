"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
  if (status === "loading" || !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>Loading profile data...</p>
      </div>
    );
  }
  return (
    <SidebarProvider>
      <AppSidebar userData={userData} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex flex-1 flex-col  pt-0 max-w-full overflow-x-scroll">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// <div className="grid auto-rows-min gap-4 md:grid-cols-3">
//             <div className="bg-muted/50 aspect-video rounded-xl" />
//             <div className="bg-muted/50 aspect-video rounded-xl" />
//             <div className="bg-muted/50 aspect-video rounded-xl" />
//           </div>
//           <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
