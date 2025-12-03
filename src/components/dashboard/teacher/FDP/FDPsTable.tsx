"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Trash, Eye, EyeOff, Download } from "lucide-react";
import { FDPFormDialog } from "./FDPFormDialog";
import { TablePagination } from "../../TablePagination";
import { FilterDialog } from "./FilterDialog";
import { fetchFDPs, deleteFDP, deleteMultipleFDPs } from "@/lib/api/teacherApi";
import { exportToCSV } from "@/lib/csvExport";

interface FilterValues {
  dateRange: { from: string; to: string };
  visibility: string;
  participantCount: string;
}

export function FDPsTable() {
  const [fdps, setFdps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFdp, setSelectedFdp] = useState<any>(null);
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
    participantCount: "all",
  });

  const loadFdps = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFDPs();
      setFdps(result.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFdps(); }, []);

  useEffect(() => {
    if (!isFormOpen) {
      loadFdps();
      setSelectedIds([]);
    }
  }, [isFormOpen]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFDP(deleteId);
      loadFdps();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await deleteMultipleFDPs(selectedIds);
      loadFdps();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredAndSortedFdps = useMemo(() => {
    let filtered = fdps.filter(fdp => {
      const dateToCheck = fdp.startDate;
      const matchesDateFrom = !filters.dateRange.from || !dateToCheck || new Date(dateToCheck) >= new Date(filters.dateRange.from);
      const matchesDateTo = !filters.dateRange.to || !dateToCheck || new Date(dateToCheck) <= new Date(filters.dateRange.to + "T23:59:59");
      const matchesVisibility = filters.visibility === "all" || (filters.visibility === "public" ? fdp.isPublic : !fdp.isPublic);
      const participantCount = fdp.participants?.length || 0;
      const matchesParticipantCount = filters.participantCount === "all" || 
        (filters.participantCount === "1" && participantCount === 1) ||
        (filters.participantCount === "2-3" && participantCount >= 2 && participantCount <= 3) ||
        (filters.participantCount === "4+" && participantCount >= 4);
      
      return matchesDateFrom && matchesDateTo && matchesVisibility && matchesParticipantCount;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "createdAt" || sortField === "startDate") {
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
  }, [fdps, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedFdps.length / itemsPerPage);
  const paginatedFdps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFdps.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedFdps, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedFdps.map(f => f.id));
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
    const data = filteredAndSortedFdps.map(f => ({
      Name: f.name,
      "Organized By": f.organizedBy || "",
      "Sponsored By": f.sponsoredBy || "",
      Venue: f.venue || "",
      Duration: f.duration || "",
      "Start Date": f.startDate ? new Date(f.startDate).toLocaleDateString() : "",
      "End Date": f.endDate ? new Date(f.endDate).toLocaleDateString() : "",
      Topic: f.topic || "",
      Participants: f.participants?.map((p: any) => p.teacher?.user?.name).join(", ") || "",
      Visibility: f.isPublic ? "Public" : "Private",
    }));
    exportToCSV(data, "fdps");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">FDPs</h2>
          <p className="text-muted-foreground">Manage your FDP entries</p>
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
          <Button onClick={() => { setSelectedFdp(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add FDP
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
                  checked={paginatedFdps.length > 0 && selectedIds.length === paginatedFdps.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[250px]">Name</TableHead>
              <TableHead className="min-w-[150px]">Participants</TableHead>
              <TableHead className="min-w-[150px]">Organized By</TableHead>
              <TableHead className="min-w-[120px]">Start Date</TableHead>
              <TableHead className="min-w-[100px]">Duration</TableHead>
              <TableHead className="min-w-[80px]">Visible</TableHead>
              <TableHead className="w-20 sticky right-0 bg-background z-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFdps.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">No FDPs found.</TableCell></TableRow>
            ) : (
              paginatedFdps.map((fdp) => (
                <TableRow key={fdp.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox 
                      checked={selectedIds.includes(fdp.id)}
                      onCheckedChange={(checked) => handleSelectOne(fdp.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{fdp.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {fdp.participants?.slice(0, 2).map((p: any) => (
                        <Badge key={p.id} variant="secondary" className="text-xs">{p.teacher?.user?.name}</Badge>
                      ))}
                      {fdp.participants?.length > 2 && <Badge variant="outline" className="text-xs">+{fdp.participants.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{fdp.organizedBy || "-"}</TableCell>
                  <TableCell>{fdp.startDate ? new Date(fdp.startDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{fdp.duration || "-"}</TableCell>
                  <TableCell>{fdp.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}</TableCell>
                  <TableCell className="sticky right-0 bg-background z-10 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedFdp(fdp); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(fdp.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSortedFdps.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      <FDPFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} fdp={selectedFdp} onSuccess={loadFdps} />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the FDP entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} FDP(s)?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the selected entries.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleMultiDelete} className="bg-red-600">Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
