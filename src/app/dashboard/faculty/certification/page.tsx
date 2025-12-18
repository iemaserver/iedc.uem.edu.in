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
      const response = await fetchCertifications({all:true});
      setCertifications(response.data || []);
    } catch (error) {
      console.error("Error loading certifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Certifications</h1>
        <p className="text-sm md:text-base text-muted-foreground">Review and manage professional certifications</p>
      </div>
    <div className="w-full h-full min-w-0">
      <div className="flex flex-col w-full h-full gap-4 min-w-0">
        {/* Top section with two columns */}
        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="w-full lg:w-1/3">
            <StatusGraph data={certifications}/>
          </div>
          <div className="w-full lg:w-2/3">
          <GrowthGraph data={certifications} /></div>
        </div>
        
        {/* Bottom section */}
      
          <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
          <CertificationsTable />
        </div>
         
        
      </div>
    </div>
    </div>
  );
}
