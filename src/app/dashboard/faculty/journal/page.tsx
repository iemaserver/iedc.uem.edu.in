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

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/journal");
      if (response.ok) {
        const result = await response.json();
        setJournals(result.data || []);
      } else {
        toast.error("Failed to fetch journals");
      }
    } catch (error) {
      console.error("Failed to fetch journals:", error);
      toast.error("Failed to fetch journals");
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
              <BreadcrumbPage>Journals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Journal Publications</h1>
            <p className="text-muted-foreground mt-2">Track and manage your journal publications</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <StatusGraph journals={journals} />
                </div>
                <div className="lg:col-span-3">
                  <GrowthGraph journals={journals} />
                </div>
              </div>

              <JournalsTable />
            </>
          )}
        </div>
      </div>
    </>
  );
}
