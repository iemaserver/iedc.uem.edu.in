"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Trash, Eye, EyeOff, Download } from "lucide-react";
import { CopyrightFormDialog } from "./CopyrightFormDialog";
import { TablePagination } from "../../TablePagination";
import { FilterDialog } from "./FilterDialog";
import { fetchCopyrights, deleteCopyright, deleteMultipleCopyrights } from "@/lib/api/teacherApi";
import { exportToCSV } from "@/lib/csvExport";

interface FilterValues {
  dateRange: { from: string; to: string };
  visibility: string;
  inventorCount: string;
  status: string;
}

export function CopyrightsTable() {
  const [copyrights, setCopyrights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCopyright, setSelectedCopyright] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: { from: "", to: "" },
    visibility: "all",
    inventorCount: "all",
    status: "all",
  });

  const loadCopyrights = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCopyrights();
      setCopyrights(result.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCopyrights(); }, []);

  useEffect(() => {
    if (!isFormOpen) {
      loadCopyrights();
      setSelectedIds([]);
    }
  }, [isFormOpen]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCopyright(deleteId);
      loadCopyrights();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await deleteMultipleCopyrights(selectedIds);
      loadCopyrights();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatus = (c: any) => {
    if (c.grantedAt) return "granted";
    if (c.publishedAt) return "published";
    if (c.submittedAt) return "submitted";
    if (c.filedAt) return "filed";
    return "draft";
  };

  const filteredAndSortedCopyrights = useMemo(() => {
    let filtered = copyrights.filter(copyright => {
      const dateToCheck = copyright.grantedAt || copyright.publishedAt || copyright.submittedAt || copyright.filedAt;
      const matchesDateFrom = !filters.dateRange.from || !dateToCheck || new Date(dateToCheck) >= new Date(filters.dateRange.from);
      const matchesDateTo = !filters.dateRange.to || !dateToCheck || new Date(dateToCheck) <= new Date(filters.dateRange.to + "T23:59:59");
      const matchesVisibility = filters.visibility === "all" || (filters.visibility === "public" ? copyright.isPublic : !copyright.isPublic);
      const inventorCount = copyright.inventors?.length || 0;
      const matchesInventorCount = filters.inventorCount === "all" || 
        (filters.inventorCount === "1" && inventorCount === 1) ||
        (filters.inventorCount === "2-3" && inventorCount >= 2 && inventorCount <= 3) ||
        (filters.inventorCount === "4+" && inventorCount >= 4);
      const status = getStatus(copyright);
      const matchesStatus = filters.status === "all" || status === filters.status;
      
      return matchesDateFrom && matchesDateTo && matchesVisibility && matchesInventorCount && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = aVal?.toString().toLowerCase() || "";
        bVal = bVal?.toString().toLowerCase() || "";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [copyrights, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedCopyrights.length / itemsPerPage);
  const paginatedCopyrights = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCopyrights.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCopyrights, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCopyrights.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleExport = () => {
    const data = filteredAndSortedCopyrights.map(c => ({
      Title: c.title,
      "Filed Date": c.filedAt ? new Date(c.filedAt).toLocaleDateString() : "",
      "Submitted Date": c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "",
      "Published Date": c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "",
      "Granted Date": c.grantedAt ? new Date(c.grantedAt).toLocaleDateString() : "",
      Status: getStatus(c),
      Inventors: c.inventors?.map((i: any) => i.teacher?.user?.name).join(", ") || "",
      Visibility: c.isPublic ? "Public" : "Private",
    }));
    exportToCSV(data, "copyrights");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Copyrights</h2>
          <p className="text-muted-foreground">Manage your copyright entries</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setIsMultiDeleteOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />Delete {selectedIds.length}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Button onClick={() => { setSelectedCopyright(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Copyright
          </Button>
        </div>
      </div>

      <FilterDialog 
        filters={filters} 
        onFiltersChange={setFilters}
        visibilityOptions={["public", "private"]}
      />

      <div className="w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-background z-10">
                <Checkbox 
                  checked={paginatedCopyrights.length > 0 && selectedIds.length === paginatedCopyrights.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[250px]">Title</TableHead>
              <TableHead className="min-w-[150px]">Inventors</TableHead>
              <TableHead className="min-w-[120px]">Filed Date</TableHead>
              <TableHead className="min-w-[120px]">Granted Date</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[80px]">Visible</TableHead>
              <TableHead className="w-20 sticky right-0 bg-background z-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCopyrights.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">No copyrights found.</TableCell></TableRow>
            ) : (
              paginatedCopyrights.map((copyright) => (
                <TableRow key={copyright.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox 
                      checked={selectedIds.includes(copyright.id)}
                      onCheckedChange={(checked) => handleSelectOne(copyright.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{copyright.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {copyright.inventors?.slice(0, 2).map((i: any) => (
                        <Badge key={i.id} variant="secondary" className="text-xs">{i.teacher?.user?.name}</Badge>
                      ))}
                      {copyright.inventors?.length > 2 && <Badge variant="outline" className="text-xs">+{copyright.inventors.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{copyright.filedAt ? new Date(copyright.filedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{copyright.grantedAt ? new Date(copyright.grantedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{getStatus(copyright)}</Badge></TableCell>
                  <TableCell>{copyright.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}</TableCell>
                  <TableCell className="sticky right-0 bg-background z-10 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedCopyright(copyright); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(copyright.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSortedCopyrights.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      <CopyrightFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} copyright={selectedCopyright} onSuccess={loadCopyrights} />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the copyright entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} copyright(s)?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the selected entries.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleMultiDelete} className="bg-red-600">Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
