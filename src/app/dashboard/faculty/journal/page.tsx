"use client";

import { useState, useEffect } from "react";
import { JournalsTable } from "@/components/dashboard/teacher/journal/JournalsTable";
import { StatusGraph } from "@/components/dashboard/teacher/journal/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/journal/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { fetchJournals } from "@/lib/api/teacherApi";

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJrs();
  }, []);

  const fetchJrs = async () => {
    setIsLoading(true);
    try {
      const response = await fetchJournals({ all: true });
      setJournals(response.data);
    } catch (error) {
      console.error("Failed to fetch journals:", error);
      toast.error("Failed to fetch journals");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Journal Publications</h1>
        <p className="text-sm md:text-base text-muted-foreground">Track and manage your journal publications</p>
      </div>
      <div className="w-full h-full min-w-0">
        <div className="flex flex-col w-full h-full gap-4 min-w-0">
          {/* Top section with two columns */}
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <div className="w-full lg:w-1/3">
              <StatusGraph journals={journals} />
            </div>
            <div className="w-full lg:w-2/3">
              <GrowthGraph journals={journals} />
            </div>
          </div>
         
            <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
              <JournalsTable />
            </div>
            
        </div>
      </div>
    </div>
  );
}
