"use client";

import { useState, useEffect } from "react";
import { ConferencesTable } from "@/components/dashboard/teacher/conference/ConferencesTable";
import { StatusGraph } from "@/components/dashboard/teacher/conference/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/conference/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchConferences } from "@/lib/api/teacherApi";

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConferences = async () => {
    setIsLoading(true);
    try {
      const result = await fetchConferences();
      console.log("Conferences loaded:", result);
      setConferences(result.data || []);
    } catch (error) {
      console.error("Failed to fetch conferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConferences();
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
              <BreadcrumbPage>Conferences</BreadcrumbPage>
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
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusGraph conferences={conferences} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthGraph conferences={conferences} />
              </CardContent>
            </Card>
          </div>
        )}

        <ConferencesTable />
      </div>
    </>
  );
}
