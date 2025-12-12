"use client";

import { useState, useEffect } from "react";
import { ResearchPapersTable } from "@/components/dashboard/teacher/research-paper/ResearchPapersTable";
// import { GrowthGraph } from "@/components/dashboard/teacher/research-paper/GrowthGraph";
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
import { StatusGraph } from "@/components/dashboard/teacher/research-paper/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/research-paper/GrowthGraph";

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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Research Papers</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review and manage student research papers</p>
        </div>
    <div className="w-full h-full min-w-0">
      <div className="flex flex-col w-full h-full gap-4 min-w-0">
        {/* Top section with two columns */}
        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="w-full lg:w-1/3">
            <StatusGraph data={papers}/>
          </div>
          <div className="w-full lg:w-2/3">
          <GrowthGraph data={papers} /></div>
        </div>
        
        {/* Bottom section */}
        {
          papers.length === 0 ?(
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No research papers found.</p>
          </div>
          ):(
          <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
          <ResearchPapersTable papers={papers} />
        </div>
          )
        }
        
      </div>
    </div>
    </div>
  );
}


