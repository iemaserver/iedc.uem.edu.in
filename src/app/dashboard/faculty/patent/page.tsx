"use client";

import { useState, useEffect } from "react";

import { StatusGraph } from "@/components/dashboard/teacher/patent/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/patent/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PatentsTable } from "@/components/dashboard/teacher/patent/PatentsTable";

export default function PatentsPage() {
  const [patents, setPatents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatents();
  }, []);

  const fetchPatents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/patent");
      if (response.ok) {
        const result = await response.json();
        setPatents(result.data || []);
      } else {
        toast.error("Failed to fetch patents");
      }
    } catch (error) {
      console.error("Failed to fetch patents:", error);
      toast.error("Failed to fetch patents");
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
              <BreadcrumbPage>Patents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Patent Applications</h1>
            <p className="text-muted-foreground mt-2">Track and manage your patent applications and grants</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <StatusGraph patents={patents} />
                </div>
                <div className="lg:col-span-3">
                  <GrowthGraph patents={patents} />
                </div>
              </div>

              <PatentsTable />
            </>
          )}
        </div>
      </div>
    </>
  );
}
