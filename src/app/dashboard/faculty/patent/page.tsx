"use client";

import { useState, useEffect } from "react";

import { StatusGraph } from "@/components/dashboard/teacher/patent/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/patent/GrowthGraph";
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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PatentsTable } from "@/components/dashboard/teacher/patent/PatentsTable";
import axios from "axios";
import { fetchPatents } from "@/lib/api/teacherApi";

export default function PatentsPage() {
  const [patents, setPatents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatent();
  }, []);

  const fetchPatent = async () => {
    setIsLoading(true);
    try {
      const response = await fetchPatents({ all: true });
      setPatents(response.data);
    } catch (error) {
      console.error("Failed to fetch patents:", error);
      toast.error("Failed to fetch patents");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Patent Applications</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your patent applications and grants
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row w-full gap-4">
                <div className="w-full lg:w-1/3">
                  <StatusGraph patents={patents} />
                </div>
                <div className="w-full lg:w-2/3">
                  <GrowthGraph patents={patents} />
                </div>
              </div>

              <PatentsTable />
            </>
          )}
        </div>
      </div>
    </>
  );
}
