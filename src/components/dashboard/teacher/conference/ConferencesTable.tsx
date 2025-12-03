"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Trash, Eye, EyeOff, Download } from "lucide-react";
import { ConferenceFormDialog } from "./ConferenceFormDialog";
import { TablePagination } from "../../TablePagination";
import { FilterDialog } from "./FilterDialog";
import { fetchConferences, deleteConference, deleteMultipleConferences } from "@/lib/api/teacherApi";
import { exportToCSV } from "@/lib/csvExport";

interface FilterValues {
  dateRange?: { from: Date; to: Date };
  status?: string;
  visibility?: string;
  mode?: string;
  authorCount?: string;
}

export function ConferencesTable() {
  const [conferences, setConferences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("conferenceStartDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterValues>({
    status: "all",
    visibility: "all",
    mode: "all",
    authorCount: "all",
  });

  const loadConferences = async () => {
    setIsLoading(true);
    try {
      const result = await fetchConferences();
      setConferences(result.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConferences(); }, []);

  useEffect(() => {
    if (!isFormOpen) {
      loadConferences();
      setSelectedIds([]);
    }
  }, [isFormOpen]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteConference(deleteId);
      loadConferences();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await deleteMultipleConferences(selectedIds);
      loadConferences();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredAndSortedConferences = useMemo(() => {
    let filtered = conferences.filter(conference => {
      const matchesDateFrom = !filters.dateRange?.from || !conference.conferenceStartDate || new Date(conference.conferenceStartDate) >= filters.dateRange.from;
      const matchesDateTo = !filters.dateRange?.to || !conference.conferenceStartDate || new Date(conference.conferenceStartDate) <= filters.dateRange.to;
      const matchesStatus = !filters.status || filters.status === "all" || conference.status === filters.status;
      const matchesVisibility = !filters.visibility || filters.visibility === "all" || (filters.visibility === "public" ? conference.isPublic : !conference.isPublic);
      const matchesMode = !filters.mode || filters.mode === "all" || conference.mode === filters.mode;
      const authorCount = conference.authors?.length || 0;
      const matchesAuthorCount = !filters.authorCount || filters.authorCount === "all" || 
        (filters.authorCount === "1" && authorCount === 1) ||
        (filters.authorCount === "multiple" && authorCount > 1);
      
      return matchesDateFrom && matchesDateTo && matchesStatus && matchesVisibility && matchesMode && matchesAuthorCount;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "conferenceStartDate") {
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
  }, [conferences, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedConferences.length / itemsPerPage);
  const paginatedConferences = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedConferences.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedConferences, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedConferences.map(c => c.id));
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
    const data = filteredAndSortedConferences.map(c => ({
      Title: c.title,
      "Conference Name": c.conferenceName,
      Mode: c.mode,
      Status: c.status,
      "Start Date": new Date(c.conferenceStartDate).toLocaleDateString(),
      "End Date": c.conferenceEndDate ? new Date(c.conferenceEndDate).toLocaleDateString() : "",
      Location: c.location || "",
      "Registration Fees": c.registrationFees || "",
      "Reimbursement Status": c.reimbursementStatus || "",
      Publisher: c.publisher || "",
      "Paper Link/DOI": c.paperLinkDOI || "",
      Authors: c.authors?.map((a: any) => a.teacher?.user?.name).join(", ") || "",
      Visibility: c.isPublic ? "Public" : "Private",
    }));
    exportToCSV(data, "conferences");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Conference Papers</h2>
          <p className="text-muted-foreground">Manage your conference publications</p>
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
          <Button onClick={() => { setSelectedConference(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Conference
          </Button>
        </div>
      </div>

      <FilterDialog 
        filters={filters} 
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ status: "all", visibility: "all", mode: "all", authorCount: "all" })}
        statusOptions={[
          { value: "all", label: "All Statuses" },
          { value: "COMMUNICATED", label: "Communicated" },
          { value: "ACCEPTED", label: "Accepted" },
          { value: "PUBLISHED", label: "Published" }
        ]}
        visibilityOptions={[
          { value: "all", label: "All" },
          { value: "public", label: "Public" },
          { value: "private", label: "Private" }
        ]}
        modeOptions={[
          { value: "all", label: "All Modes" },
          { value: "ONLINE", label: "Online" },
          { value: "OFFLINE", label: "Offline" },
          { value: "HYBRID", label: "Hybrid" }
        ]}
      />

      <div className="w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-background z-10">
                <Checkbox 
                  checked={paginatedConferences.length > 0 && selectedIds.length === paginatedConferences.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[250px]">Title</TableHead>
              <TableHead className="min-w-[200px]">Conference</TableHead>
              <TableHead className="min-w-[150px]">Authors</TableHead>
              <TableHead className="min-w-[100px]">Mode</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Start Date</TableHead>
              <TableHead className="min-w-[120px]">Location</TableHead>
              <TableHead className="min-w-[100px]">Fees</TableHead>
              <TableHead className="min-w-[80px]">Visible</TableHead>
              <TableHead className="w-20 sticky right-0 bg-background z-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedConferences.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center h-24">No conferences found.</TableCell></TableRow>
            ) : (
              paginatedConferences.map((conference) => (
                <TableRow key={conference.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox 
                      checked={selectedIds.includes(conference.id)}
                      onCheckedChange={(checked) => handleSelectOne(conference.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{conference.title}</TableCell>
                  <TableCell>{conference.conferenceName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {conference.authors?.slice(0, 2).map((a: any) => (
                        <Badge key={a.id} variant="secondary" className="text-xs">{a.teacher?.user?.name}</Badge>
                      ))}
                      {conference.authors?.length > 2 && <Badge variant="outline" className="text-xs">+{conference.authors.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{conference.mode}</Badge></TableCell>
                  <TableCell><Badge>{conference.status}</Badge></TableCell>
                  <TableCell>{new Date(conference.conferenceStartDate).toLocaleDateString()}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{conference.location || "-"}</TableCell>
                  <TableCell>{conference.registrationFees ? `₹${conference.registrationFees}` : "-"}</TableCell>
                  <TableCell>{conference.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}</TableCell>
                  <TableCell className="sticky right-0 bg-background z-10 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedConference(conference); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(conference.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSortedConferences.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      <ConferenceFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} conference={selectedConference} onSuccess={loadConferences} />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the conference entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} conference(s)?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the selected entries.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleMultiDelete} className="bg-red-600">Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
