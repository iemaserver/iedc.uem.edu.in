"use client";

import { useState, useEffect } from "react";
import { CertificationsTable } from "@/components/dashboard/teacher/certification/CertificationsTable";
import { StatusGraph } from "@/components/dashboard/teacher/certification/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/certification/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { fetchCertifications } from "@/lib/api/teacherApi";

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCertifications();
      console.log("Certifications response:", response);
      console.log("Certifications data count:", response.data?.length || 0);
      setCertifications(response.data || []);
    } catch (error) {
      console.error("Error loading certifications:", error);
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
              <BreadcrumbPage>Certifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Certifications</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review and manage professional certifications</p>
        </div>

        {/* Graphs Row - Pie Chart (25%) and Growth Chart (75%) */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading analytics...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <StatusGraph data={certifications} />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <GrowthGraph data={certifications} />
            </div>
          </div>
        )}

        {/* Table */}
        <CertificationsTable />
      </div>
    </>
  );
}
