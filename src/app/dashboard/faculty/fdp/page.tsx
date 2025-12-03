"use client";

import { useState, useEffect } from "react";
import { FDPsTable } from "@/components/dashboard/teacher/FDP/FDPsTable";
import { StatusGraph } from "@/components/dashboard/teacher/FDP/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/FDP/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchFDPs } from "@/lib/api/teacherApi";

export default function FDPsPage() {
  const [fdps, setFdps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFdps = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFDPs();
      console.log("FDPs loaded:", result);
      setFdps(result.data || []);
    } catch (error) {
      console.error("Failed to fetch FDPs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFdps();
  }, []);

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
              <BreadcrumbPage>FDPs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <div className="text-muted-foreground">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Visibility Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusGraph fdps={fdps} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthGraph fdps={fdps} />
              </CardContent>
            </Card>
          </div>
        )}

        <FDPsTable />
      </div>
    </>
  );
}
