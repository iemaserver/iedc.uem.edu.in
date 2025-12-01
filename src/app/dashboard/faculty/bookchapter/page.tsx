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
import { exportToCSV } from "@/lib/csvExport";
import { fetchBookChapters } from "@/lib/api/teacherApi";

export default function BookChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadBookChapters();
  }, []);

  const loadBookChapters = async () => {
    try {
      const response = await fetchBookChapters();
      setChapters(response.data || []);
    } catch (error) {
      console.error("Error loading book chapters:", error);
    }
  };

  useEffect(() => {
    filterChapters();
  }, [chapters, searchQuery, statusFilter]);

  const filterChapters = () => {
    let filtered = chapters;

    if (searchQuery) {
      filtered = filtered.filter(
        (chapter) =>
          chapter.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chapter.authors?.some((author: any) => 
            author.teacher?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((chapter) => chapter.status === statusFilter);
    }

    setFilteredChapters(filtered);
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
              <BreadcrumbPage>Book Chapters</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Book Chapters</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review and manage book chapter publications</p>
        </div>

        {/* Graphs Row - Pie Chart (25%) and Growth Chart (75%) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="md:col-span-2 lg:col-span-1">
            <StatusGraph data={chapters} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <GrowthGraph data={chapters} />
          </div>
        </div>

        {/* Filters */}
          

        {/* Table */}
        <BookChaptersTable />
      </div>
    </>
  );
}
