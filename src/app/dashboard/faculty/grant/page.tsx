"use client";

import { useState, useEffect } from "react";
import { GrantsTable } from "@/components/dashboard/teacher/grant/GrantsTable";
import { StatusGraph } from "@/components/dashboard/teacher/grant/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/grant/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function GrantsPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/grant");
      if (response.ok) {
        const result = await response.json();
        setGrants(result.data || []);
      } else {
        toast.error("Failed to fetch grants");
      }
    } catch (error) {
      console.error("Failed to fetch grants:", error);
      toast.error("Failed to fetch grants");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Research Grants & Projects</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your funded research projects and grant applications</p>
      </div>
      <div className="w-full h-full min-w-0">
        <div className="flex flex-col w-full h-full gap-4 min-w-0">
          {/* Top section with two columns */}
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <div className="w-full lg:w-1/3">
              <StatusGraph grants={grants} />
            </div>
            <div className="w-full lg:w-2/3">
              <GrowthGraph grants={grants} />
            </div>
          </div>
          
          {/* Bottom section */}
          {
            grants.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No grants found.</p>
            </div>
            ) : (
            <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
              <GrantsTable />
            </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
