"use client";

import { useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import {
  exportCopyrightsToCSV,
  exportPatentsToCSV,
  exportJournalsToCSV,
  exportConferencesToCSV,
  exportTransactionsToCSV,
  exportBookChaptersToCSV,
  exportGrantsToCSV,
  exportFDPsToCSV,
  exportCertificationsToCSV,
  exportAllResearchWorksToCSV,
  downloadCSV,
} from "@/lib/csvExport";

type ExportType = 
  | "copyrights" 
  | "patents" 
  | "journals" 
  | "conferences" 
  | "transactions" 
  | "bookchapters" 
  | "grants" 
  | "fdps" 
  | "certifications" 
  | "all";

interface ExportOption {
  type: ExportType;
  title: string;
  description: string;
  icon: string;
}

const exportOptions: ExportOption[] = [
  {
    type: "all",
    title: "All Research Works",
    description: "Export all your research works in a single CSV file",
    icon: "📊",
  },
  {
    type: "copyrights",
    title: "Copyrights",
    description: "Export all your copyright records",
    icon: "©️",
  },
  {
    type: "patents",
    title: "Patents",
    description: "Export all your patent records",
    icon: "⚖️",
  },
  {
    type: "journals",
    title: "Journals",
    description: "Export all your journal publications",
    icon: "📰",
  },
  {
    type: "conferences",
    title: "Conferences",
    description: "Export all your conference papers",
    icon: "🎤",
  },
  {
    type: "transactions",
    title: "Transactions",
    description: "Export all your transaction records",
    icon: "💳",
  },
  {
    type: "bookchapters",
    title: "Book Chapters",
    description: "Export all your book chapter contributions",
    icon: "📚",
  },
  {
    type: "grants",
    title: "Grants",
    description: "Export all your grant/funding records",
    icon: "💰",
  },
  {
    type: "fdps",
    title: "FDPs",
    description: "Export all your Faculty Development Programs",
    icon: "🎓",
  },
  {
    type: "certifications",
    title: "Certifications",
    description: "Export all your certifications",
    icon: "🏆",
  },
];

export default function ExportPage() {
  const [loading, setLoading] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    setLoading(type);
    
    try {
      const response = await fetch(`/api/teacher/export?type=${type}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      
      // Generate CSV based on type
      let csvContent = "";
      let filename = "";

      if (type === "all") {
        csvContent = exportAllResearchWorksToCSV(result);
        filename = `all-research-works-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        const data = result.data;
        
        if (!data || data.length === 0) {
          toast.error(`No ${type} data found to export`);
          return;
        }

        switch (type) {
          case "copyrights":
            csvContent = exportCopyrightsToCSV(data);
            filename = `copyrights-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "patents":
            csvContent = exportPatentsToCSV(data);
            filename = `patents-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "journals":
            csvContent = exportJournalsToCSV(data);
            filename = `journals-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "conferences":
            csvContent = exportConferencesToCSV(data);
            filename = `conferences-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "transactions":
            csvContent = exportTransactionsToCSV(data);
            filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "bookchapters":
            csvContent = exportBookChaptersToCSV(data);
            filename = `book-chapters-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "grants":
            csvContent = exportGrantsToCSV(data);
            filename = `grants-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "fdps":
            csvContent = exportFDPsToCSV(data);
            filename = `fdps-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "certifications":
            csvContent = exportCertificationsToCSV(data);
            filename = `certifications-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        }
      }

      if (csvContent) {
        downloadCSV(csvContent, filename);
        toast.success("CSV file downloaded successfully!");
      } else {
        toast.error("Failed to generate CSV file");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setLoading(null);
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
              <BreadcrumbPage>Export Research Data</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Research Data</h1>
          <p className="text-muted-foreground mt-2">
            Download your research work data in CSV format for reports, analysis, or archiving
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exportOptions.map((option) => (
            <Card key={option.type} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{option.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport(option.type)}
                  disabled={loading !== null}
                  className="w-full"
                  variant={option.type === "all" ? "default" : "outline"}
                >
                  {loading === option.type ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              About CSV Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • CSV files can be opened in Excel, Google Sheets, or any spreadsheet application
            </p>
            <p>
              • All dates are formatted as MM/DD/YYYY for compatibility
            </p>
            <p>
              • Multiple values (like keywords, authors) are separated by semicolons
            </p>
            <p>
              • The "All Research Works" option creates a summary view of all your work
            </p>
            <p>
              • Individual exports contain detailed information specific to each category
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
