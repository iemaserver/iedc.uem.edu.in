"use client";

import { useState, useEffect } from "react";
import { ConferencesTable } from "@/components/dashboard/teacher/conference/ConferencesTable";
import { StatusGraph } from "@/components/dashboard/teacher/conference/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/conference/GrowthGraph";
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
import { fetchConferences } from "@/lib/api/teacherApi";

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConferences = async () => {
    setIsLoading(true);
    try {
      const result = await fetchConferences({ all: true });
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">
          Conferences
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Review and manage conference publications
        </p>
      </div>
      <div className="w-full h-full min-w-0">
        <div className="flex flex-col w-full h-full gap-4 min-w-0">
          {/* Top section with two columns */}
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <div className="w-full lg:w-1/3">
              <StatusGraph conferences={conferences} />
            </div>
            <div className="w-full lg:w-2/3">
              <GrowthGraph conferences={conferences} />
            </div>
          </div>

          {/* Bottom section */}
          
            <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
              <ConferencesTable />
            </div>
          </div>
      </div>
    </div>
  );
}
