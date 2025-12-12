"use client";

import { useState, useEffect } from "react";
import { BookChaptersTable } from "@/components/dashboard/teacher/book-chapter/BookChaptersTable";
import { StatusGraph } from "@/components/dashboard/teacher/book-chapter/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/book-chapter/GrowthGraph";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchBookChapters } from "@/lib/api/teacherApi";

export default function BookChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);


  useEffect(() => {
    loadBookChapters();
  }, []);

  const loadBookChapters = async () => {
    try {
      const response = await fetchBookChapters({all: true});
      setChapters(response.data || []);
    } catch (error) {
      console.error("Error loading book chapters:", error);
    }
  };

  
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Book Chapters</h1>
        <p className="text-sm md:text-base text-muted-foreground">Review and manage book chapter publications</p>
      </div>
    <div className="w-full h-full min-w-0">
      <div className="flex flex-col w-full h-full gap-4 min-w-0">
        {/* Top section with two columns */}
        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="w-full lg:w-1/3">
            <StatusGraph data={chapters}/>
          </div>
          <div className="w-full lg:w-2/3">
          <GrowthGraph data={chapters} /></div>
        </div>
        
        {/* Bottom section */}
        
          <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
          <BookChaptersTable />
        </div>
          
        
        
      </div>
    </div>
    </div>
  );
}
