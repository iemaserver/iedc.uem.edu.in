"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Edit, Trash2, Search, ChevronUp, ChevronDown, ChevronsUpDown, Trash, Download } from "lucide-react";
import { CertificationFormDialog } from "./CertificationFormDialog";
import { TablePagination } from "../../TablePagination";
import { fetchCertifications as fetchCertificationsApi, deleteCertification, deleteMultipleCertifications } from "@/lib/api/teacherApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { exportCertificationsExcel } from "@/lib/csvExport";
import { FilterDialog } from "./FilterDialog";

export function CertificationsTable() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [titleInput, setTitleInput] = useState<string>("");

  const [filters, setFilters] = useState<{
    isPublic?: boolean;
    title?: string;
    offeredBy?: string;
    remarks?: string;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    completedAfter?: string;
    completedBefore?: string;
    teacherName?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    all?: boolean;
  }>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Debounce title input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        title: titleInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [titleInput]);

  // Fetch data whenever filters change
  useEffect(() => {
    fetchCertifications();
  }, [filters]);

  const fetchCertifications = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCertificationsApi(filters);
      setCertifications(result.data || []);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.total);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    const updates: any = {
      ...{ [key]: value },
    };

    if (key === "page" || key === "limit") {
      if (key === "page") {
        updates.all = false;
      }
    } else {
      updates.page = 1;
    }

    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
      all: false,
    }));
  };

  const clearFilters = () => {
    setTitleInput("");
    setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      all: false,
    });
  };

  const handleSort = (field: string) => {
    const newOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    updateFilters({ sortBy: field, sortOrder: newOrder });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCertification(deleteId);
      fetchCertifications();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMultipleCertifications(selectedIds);
      fetchCertifications();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelectAll = () => {
    const allPageIds = certifications.map((c) => c.id);
    const allSelected = allPageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
  ).length;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && certifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <CardTitle
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  background: "linear-gradient(to right, var(--first-color), var(--second-color))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Certifications
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Professional certifications and credentials
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {selectedIds.length > 0 && (
                <Button 
                  onClick={() => setIsMultiDeleteOpen(true)} 
                  variant="destructive" 
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Trash className="h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
              <Button 
                onClick={() => exportCertificationsExcel(certifications, "certifications.xlsx")} 
                variant="outline" 
                className="w-full sm:w-auto gap-2"
                size="sm"
                style={{
                  borderColor: "var(--third-color)",
                  color: "var(--first-color)",
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                onClick={() => { setSelectedCertification(null); setIsFormOpen(true); }} 
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Certification
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by certification name..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />

            <Select
              value={filters.isPublic === undefined ? "all" : filters.isPublic ? "public" : "private"}
              onValueChange={(value) => 
                updateFilter("isPublic", value === "all" ? undefined : value === "public")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] hidden md:flex">
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4 border rounded-md px-3 py-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-records"
                  checked={filters.all || false}
                  onCheckedChange={(checked) => updateFilter("all", checked === true)}
                />
                <label
                  htmlFor="all-records"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show All Records
                </label>
              </div>
            </div>

            <Select
              value={filters.limit?.toString() || "10"}
              onValueChange={(val) => updateFilter("limit", Number(val))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border-2"
              style={{
                borderColor: "var(--third-color)",
                backgroundColor: "var(--forth-color)",
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-sm font-semibold px-3 py-1"
                  style={{
                    background: "linear-gradient(to right, var(--first-color), var(--second-color))",
                    color: "white",
                  }}
                >
                  {selectedIds.length} Selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearAllSelections} className="text-xs">
                  Clear Selection
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setIsMultiDeleteOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <Table className="">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={certifications.length > 0 && certifications.every((c) => selectedIds.includes(c.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button variant="ghost" onClick={() => handleSort("certificationName")} className="h-8 px-2 hover:bg-muted/50">
                      Certification Name
                      {filters.sortBy === "certificationName" && (filters.sortOrder === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                      {filters.sortBy !== "certificationName" && <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Holders</TableHead>
                  <TableHead className="min-w-[150px]">
                    <Button variant="ghost" onClick={() => handleSort("offeredBy")} className="h-8 px-2 hover:bg-muted/50">
                      Offered By
                      {filters.sortBy === "offeredBy" && (filters.sortOrder === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                      {filters.sortBy !== "offeredBy" && <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort("completedAt")} className="h-8 px-2 hover:bg-muted/50">
                      Completed
                      {filters.sortBy === "completedAt" && (filters.sortOrder === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                      {filters.sortBy !== "completedAt" && <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button variant="ghost" onClick={() => handleSort("isPublic")} className="h-8 px-2 hover:bg-muted/50">
                      Visibility
                      {filters.sortBy === "isPublic" && (filters.sortOrder === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button variant="ghost" onClick={() => handleSort("createdAt")} className="h-8 px-2 hover:bg-muted/50">
                      Created At
                      {filters.sortBy === "createdAt" && (filters.sortOrder === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : certifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {activeFilterCount > 0 ? "No certifications match your filters." : "No certifications found. Create your first one!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  certifications.map((cert) => (
                    <TableRow key={cert.id} className="hover:bg-muted/50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(cert.id)}
                          onCheckedChange={() => toggleSelectOne(cert.id)}
                          aria-label={`Select ${cert.certificationName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-sm">
                        <div className="line-clamp-2" title={cert.certificationName}>
                          {cert.certificationName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex -space-x-2">
                            {cert.holders?.slice(0, 3).map((holder: any) => (
                              <Tooltip key={holder.id}>
                                <TooltipTrigger>
                                  <Avatar className="w-8 h-8 border-2 border-background">
                                    <AvatarImage src={holder.teacher?.user?.image} />
                                    <AvatarFallback>
                                      {holder.teacher?.user?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {holder.teacher?.user?.name || "Unknown"}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {cert.holders && cert.holders.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{cert.holders.length - 3}
                              </div>
                            )}
                            {(!cert.holders || cert.holders.length === 0) && (
                              <span className="text-xs text-muted-foreground">No holders</span>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-sm">{cert.offeredBy || "N/A"}</TableCell>
                      <TableCell className="text-sm">{cert.completedAt ? formatDate(cert.completedAt) : "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={cert.isPublic ? "default" : "secondary"}
                          className="text-xs"
                          style={
                            cert.isPublic
                              ? {
                                  background: "linear-gradient(to right, var(--first-color), var(--second-color))",
                                  color: "white",
                                }
                              : {}
                          }
                        >
                          {cert.isPublic ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(cert.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedCertification(cert); setIsFormOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setDeleteId(cert.id); setIsDeleteOpen(true); }} className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 px-4 pb-4">
            <TablePagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={filters.limit || 10}
              onPageChange={(page) => updateFilter("page", page)}
            />
          </div>
        </CardContent>
      </Card>

      <CertificationFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} certification={selectedCertification} onSuccess={fetchCertifications} />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the certification entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Certifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} certification{selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedIds.length} Item{selectedIds.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
