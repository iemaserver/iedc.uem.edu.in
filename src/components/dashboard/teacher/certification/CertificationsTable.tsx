"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Search, ArrowUpDown, Trash } from "lucide-react";
import { CertificationFormDialog } from "./CertificationFormDialog";
import { TablePagination } from "../../TablePagination";
import { exportToCSV } from "@/lib/csvExport";
import { FilterDialog, useFilters } from "./FilterDialog";
import { fetchCertifications as fetchCertificationsApi, deleteCertification, deleteMultipleCertifications } from "@/lib/api/teacherApi";
import { Checkbox } from "@/components/ui/checkbox";

export function CertificationsTable() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  
  const { filters, setFilters, clearFilters } = useFilters();
  const [sortField, setSortField] = useState<string>("completedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCertifications = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCertificationsApi();
      setCertifications(result.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCertifications(); }, []);

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
    if (selectedIds.length === paginatedCertifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCertifications.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const visibilityOptions = [
    { value: "all", label: "All Visibility" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const filteredAndSortedCertifications = useMemo(() => {
    let filtered = certifications.filter(cert => {
      // Visibility filtering
      const matchesVisibility = !filters.visibility || filters.visibility === "all" ||
        (filters.visibility === "public" && cert.isPublic) ||
        (filters.visibility === "private" && !cert.isPublic);
      
      // Date filtering (using completedAt)
      const certDate = cert.completedAt ? new Date(cert.completedAt) : null;
      const matchesDateFrom = !filters.dateRange?.from || !certDate || certDate >= filters.dateRange.from;
      const matchesDateTo = !filters.dateRange?.to || !certDate || certDate <= new Date(filters.dateRange.to.getTime() + 86400000 - 1);
      
      // Holder count filtering
      const holderCount = cert.holders?.length || 0;
      const matchesHolderCount = !filters.holderCount || filters.holderCount === "all" ||
        (filters.holderCount === "1" && holderCount === 1) ||
        (filters.holderCount === "multiple" && holderCount > 1);
      
      return matchesVisibility && matchesDateFrom && matchesDateTo && matchesHolderCount;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "completedAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = aVal?.toString().toLowerCase() || "";
        bVal = bVal?.toString().toLowerCase() || "";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [certifications, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedCertifications.length / itemsPerPage);
  const paginatedCertifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCertifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCertifications, currentPage, itemsPerPage]);

  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedIds([]);
  }, [filters]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  useEffect(() => {
    if (!isFormOpen && !isDeleteOpen && !isMultiDeleteOpen) {
      fetchCertifications();
    }
  }, [isFormOpen, isDeleteOpen, isMultiDeleteOpen]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Certifications</h2>
          <p className="text-sm text-muted-foreground">Professional certifications and credentials</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedIds.length > 0 && (
            <Button 
              onClick={() => setIsMultiDeleteOpen(true)} 
              variant="destructive" 
              className="gap-2 w-full sm:w-auto"
            >
              <Trash className="h-4 w-4" />
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => exportToCSV(filteredAndSortedCertifications, "certifications")} variant="outline" className="w-full sm:w-auto bg-green-300 text-black font-semibold hover:bg-green-400 border-green-500 border">
            Export CSV
          </Button>
          <Button onClick={() => { setSelectedCertification(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />Add Certification
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <FilterDialog
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          visibilityOptions={visibilityOptions}
        />
        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full overflow-x-auto rounded-md border">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] sm:w-[50px] sticky left-0 bg-background z-10">
                <Checkbox
                  checked={selectedIds.length === paginatedCertifications.length && paginatedCertifications.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[200px]"><Button variant="ghost" onClick={() => handleSort("certificationName")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Certification Name <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">Holders</TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]"><Button variant="ghost" onClick={() => handleSort("offeredBy")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Offered By <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[120px]"><Button variant="ghost" onClick={() => handleSort("completedAt")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Completed <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[80px]">Link</TableHead>
              <TableHead className="whitespace-nowrap min-w-[100px]">Visibility</TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[80px] sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCertifications.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">{filters.visibility || filters.dateRange ? "No certifications match your filters." : "No certifications found."}</TableCell></TableRow>
            ) : (
              paginatedCertifications.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={selectedIds.includes(cert.id)}
                      onCheckedChange={() => toggleSelectOne(cert.id)}
                      aria-label={`Select ${cert.certificationName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium min-w-[200px]">
                    <div className="max-w-[250px] truncate" title={cert.certificationName}>{cert.certificationName}</div>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {cert.holders && cert.holders.length > 0 ? (
                      <div className="text-xs sm:text-sm space-y-1">
                        {cert.holders.map((holder: any, idx: number) => (
                          <div key={idx} className="truncate max-w-[150px]" title={holder.teacher?.user?.name}>{holder.teacher?.user?.name || "Unknown"}</div>
                        ))}
                      </div>
                    ) : "N/A"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{cert.offeredBy || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{cert.link ? <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a> : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={cert.isPublic ? "default" : "secondary"} className="text-xs">
                      {cert.isPublic ? "Public" : "Private"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedCertification(cert); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(cert.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSortedCertifications.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

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
