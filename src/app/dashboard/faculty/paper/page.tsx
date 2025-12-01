"use client";

import { useState, useEffect } from "react";
import { ResearchPapersTable } from "@/components/dashboard/teacher/research-paper/ResearchPapersTable";
import { StatusGraph } from "@/components/dashboard/teacher/research-paper/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/research-paper/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function FacultyResearchPaperPage() {
  const [papers, setPapers] = useState<any[]>([]);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const response = await fetch("/api/research-paper");
      if (response.ok) {
        const result = await response.json();
        setPapers(result.data || []);
      }
    } catch (error) {
      console.error("Error loading research papers:", error);
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
              <BreadcrumbPage>Research Papers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Research Papers</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review and manage student research papers</p>
        </div>

        {/* Graphs Row - Pie Chart (25%) and Growth Chart (75%) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="md:col-span-2 lg:col-span-1">
            <StatusGraph data={papers} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <GrowthGraph data={papers} />
          </div>
        </div>

        {/* Table */}
        <ResearchPapersTable />
      </div>
    </>
  );
}
