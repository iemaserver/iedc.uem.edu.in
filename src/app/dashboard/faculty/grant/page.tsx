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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Grants</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Research Grants & Projects</h1>
            <p className="text-muted-foreground mt-2">Manage your funded research projects and grant applications</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <StatusGraph grants={grants} />
                </div>
                <div className="lg:col-span-3">
                  <GrowthGraph grants={grants} />
                </div>
              </div>

              <GrantsTable />
            </>
          )}
        </div>
      </div>
    </>
  );
}
