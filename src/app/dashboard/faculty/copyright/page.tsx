"use client";

import { useState, useEffect } from "react";
import { CopyrightsTable } from "@/components/dashboard/teacher/copyright/CopyrightsTable";
import { StatusGraph } from "@/components/dashboard/teacher/copyright/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/copyright/GrowthGraph";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
      const result = await fetchCopyrights({ all: true });
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">
          Copyrights
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Review and manage copyright registrations
        </p>
      </div>
      <div className="w-full h-full min-w-0">
        <div className="flex flex-col w-full h-full gap-4 min-w-0">
          {/* Top section with two columns */}
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <div className="w-full lg:w-1/3">
              <StatusGraph copyrights={copyrights} />
            </div>
            <div className="w-full lg:w-2/3">
              <GrowthGraph copyrights={copyrights} />
            </div>
          </div>

          <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
            <CopyrightsTable />
          </div>
        </div>
      </div>
    </div>
  );
}
