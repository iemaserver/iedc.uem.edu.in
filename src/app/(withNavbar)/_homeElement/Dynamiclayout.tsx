"use client";

import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Achievement } from "@prisma/client";
import axios from "axios";

export default function DynamicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const topBarRef = React.useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = React.useState<number | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    
    const updateHeight = () => {
      if (topBarRef.current) {
        // Set the height of the top bar in pixels
        setTopBarHeight(topBarRef.current.offsetHeight);
      }
    };

    // Update height on mount and on window resize
    updateHeight();
    window.addEventListener("resize", updateHeight);

    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener("resize", updateHeight);
  }, []); // Empty dependency array means this effect runs once after the initial render

  useEffect(() => {
    try{
      const fetchAchievements = async () => {
        const response = await axios.get("/api/user/admin/achievement");
        if (response.status !== 200) {
          throw new Error("Failed to fetch achievements");
        }
        const data = response.data as Achievement[];
        console.log("Fetched Achievements:", data);
        setAchievements(data);
      };

      fetchAchievements();
      
    } catch (error) {
      console.error(error);
    }
    
  }, []);



  return (
    <div className="flex flex-col h-screen w-screen overflow-x-hidden hide-scrollbar bg-gray-100">
      {/* Top Bar: Its height is dynamic based on content. We use a ref to measure it. */}
      <div
        ref={topBarRef}
        className="w-full h-fit" // Added padding for better visualization
      >
        <Navbar />
      </div>
      {/* Main Content Area: It's a flex container for the left and right panels. */}
      <div
        className="flex flex-grow w-full"
        style={{ 
          height: isClient && topBarHeight !== null 
            ? `calc(100vh - ${topBarHeight}px)` 
            : "auto" 
        }}
      >
        {/* Left Side: Visible on all screens. Its content is scrollable if needed. */}
        <div className="w-full lg:w-4/5 overflow-y-auto hide-scrollbar pb-10">
          <div className="h-fit  rounded-md ">{children}</div>
        </div>

        {/* Right Side: Visible only on medium screens and up (md:). */}
        <div className="hidden lg:flex flex-col items-center justify-start lg:w-1/5 p-4">
          <Sidebar achievements={achievements} />
        </div>
      </div>
      <Footer/>
    </div>
  );
}
