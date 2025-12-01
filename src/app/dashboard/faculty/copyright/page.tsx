"use client";

import { useState, useEffect } from "react";
import { CopyrightsTable } from "@/components/dashboard/teacher/copyright/CopyrightsTable";
import { StatusGraph } from "@/components/dashboard/teacher/copyright/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/copyright/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCopyrights } from "@/lib/api/teacherApi";

export default function CopyrightsPage() {
  const [copyrights, setCopyrights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCopyrights = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCopyrights();
      console.log("Copyrights loaded:", result);
      setCopyrights(result.data || []);
    } catch (error) {
      console.error("Failed to fetch copyrights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCopyrights();
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
              <BreadcrumbPage>Copyrights</BreadcrumbPage>
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
                <StatusGraph copyrights={copyrights} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthGraph copyrights={copyrights} />
              </CardContent>
            </Card>
          </div>
        )}

        <CopyrightsTable />
      </div>
    </>
  );
}
