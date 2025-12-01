"use client";

import { useState, useEffect } from "react";
import { OngoingProjectsTable } from "@/components/dashboard/teacher/ongoing-project/OngoingProjectsTable";
import { StatusGraph } from "@/components/dashboard/teacher/ongoing-project/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/ongoing-project/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function FacultyProjectPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/ongoing-project");
      if (response.ok) {
        const result = await response.json();
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error loading ongoing projects:", error);
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
              <BreadcrumbPage>Ongoing Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ongoing Projects</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review and manage student projects</p>
        </div>

        {/* Graphs Row - Pie Chart (25%) and Growth Chart (75%) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="md:col-span-2 lg:col-span-1">
            <StatusGraph data={projects} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <GrowthGraph data={projects} />
          </div>
        </div>

        {/* Table */}
        <OngoingProjectsTable />
      </div>
    </>
  );
}
