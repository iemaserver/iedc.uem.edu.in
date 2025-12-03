"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, Search, Download, Eye, EyeOff } from "lucide-react";
import { GrantFormDialog } from "./GrantFormDialog";
import { FilterDialog } from "./FilterDialog";
import { TablePagination } from "../../TablePagination";
import { deleteMultipleGrants } from "@/lib/api/teacherApi";
import { exportToCSV } from "@/lib/csvExport";
import toast from "react-hot-toast";

export function GrantsTable() {
  const [grants, setGrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    dateRange: { from: "", to: "" },
    visibility: "all",
    investigatorCount: "all",
    status: "all",
  });

  const fetchGrants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/grant");
      const result = await response.json();
      setGrants(result.data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch grants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGrants(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/teacher/grant/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Grant deleted successfully");
        fetchGrants();
        setIsDeleteOpen(false);
        setDeleteId(null);
      } else {
        toast.error("Failed to delete grant");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete grant");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await deleteMultipleGrants(Array.from(selectedIds));
      toast.success(`${selectedIds.size} grants deleted successfully`);
      fetchGrants();
      setIsBulkDeleteOpen(false);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error(error.message || "Failed to delete grants");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedGrants.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedGrants.map(g => g.id)));
  };

  const filteredGrants = useMemo(() => {
    let filtered = grants.filter(grant => {
      const matchesSearch = searchTerm === "" || 
        grant.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.projectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.projectPI?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.projectCoPI?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVisibility = filters.visibility === "all" || 
        (filters.visibility === "public" && grant.isPublic) ||
        (filters.visibility === "private" && !grant.isPublic);

      const matchesStatus = filters.status === "all" || grant.status?.toLowerCase() === filters.status.toLowerCase();

      const investigatorCount = grant.investigators?.length || 0;
      const matchesInvestigatorCount = filters.investigatorCount === "all" ||
        (filters.investigatorCount === "1" && investigatorCount === 1) ||
        (filters.investigatorCount === "2-3" && investigatorCount >= 2 && investigatorCount <= 3) ||
        (filters.investigatorCount === "4+" && investigatorCount >= 4);
      
      const grantDate = grant.grantedAt ? new Date(grant.grantedAt) : null;
      const matchesDateFrom = !filters.dateRange.from || !grantDate || grantDate >= new Date(filters.dateRange.from);
      const matchesDateTo = !filters.dateRange.to || !grantDate || grantDate <= new Date(filters.dateRange.to + "T23:59:59");
      
      return matchesSearch && matchesVisibility && matchesStatus && matchesInvestigatorCount && matchesDateFrom && matchesDateTo;
    });
    return filtered;
  }, [grants, searchTerm, filters]);

  const totalPages = Math.ceil(filteredGrants.length / itemsPerPage);
  const paginatedGrants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGrants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGrants, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

  const handleExportCSV = () => {
    const selectedGrants = grants.filter(g => selectedIds.has(g.id));
    const dataToExport = selectedGrants.length > 0 ? selectedGrants : filteredGrants;
    
    const csvData = dataToExport.map(grant => ({
      Title: grant.title,
      "Project Code": grant.projectCode || "",
      "Project PI": grant.projectPI || "",
      "Project Co-PI": grant.projectCoPI || "",
      Status: grant.status || "",
      "Applied Date": grant.appliedAt ? new Date(grant.appliedAt).toLocaleDateString() : "",
      "Granted Date": grant.grantedAt ? new Date(grant.grantedAt).toLocaleDateString() : "",
      "Completed Date": grant.completedAt ? new Date(grant.completedAt).toLocaleDateString() : "",
      "Duration (Months)": grant.durationMonths || "",
      "Grant Amount": grant.grantAmount || "",
      "Utilized Amount": grant.utilizedAmount || "",
      "Remaining Amount": grant.remainingAmount || "",
      Publication: grant.publication || "",
      "Publication Details": grant.publicationDetails || "",
      Visibility: grant.isPublic ? "Public" : "Private",
      "Investigator Count": grant.investigators?.length || 0,
    }));
    
    exportToCSV(csvData, `grants_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} grants to CSV`);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Grants & Projects</h2>
          <p className="text-muted-foreground">Manage your funded research projects</p>
        </div>
        <Button onClick={() => { setSelectedGrant(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Grant
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, project code, PI, or Co-PI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <FilterDialog filters={filters} onFiltersChange={setFilters} />
        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
          <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Export Selected</Button>
          <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Delete Selected</Button>
        </div>
      )}

      <div className="w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-background z-10">
                <Checkbox checked={selectedIds.size === paginatedGrants.length && paginatedGrants.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="min-w-[250px] sticky left-12 bg-background z-10">Project Title</TableHead>
              <TableHead className="min-w-[120px]">Code</TableHead>
              <TableHead className="min-w-[150px]">PI</TableHead>
              <TableHead className="min-w-[150px]">Co-PI</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[130px]">Amount (₹)</TableHead>
              <TableHead className="min-w-[120px]">Investigators</TableHead>
              <TableHead className="min-w-[100px]">Visibility</TableHead>
              <TableHead className="text-right whitespace-nowrap sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGrants.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center h-24">{searchTerm || filters.visibility !== "all" || filters.status !== "all" ? "No grants match your filters." : "No grants found."}</TableCell></TableRow>
            ) : (
              paginatedGrants.map((grant) => (
                <TableRow key={grant.id} className={selectedIds.has(grant.id) ? "bg-muted/50" : ""}>
                  <TableCell className="sticky left-0 bg-background">
                    <Checkbox checked={selectedIds.has(grant.id)} onCheckedChange={() => toggleSelection(grant.id)} />
                  </TableCell>
                  <TableCell className="font-medium sticky left-12 bg-background">{grant.title}</TableCell>
                  <TableCell className="whitespace-nowrap">{grant.projectCode || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{grant.projectPI || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{grant.projectCoPI || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{grant.status ? <Badge>{grant.status}</Badge> : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{grant.grantAmount ? `₹${grant.grantAmount.toLocaleString()}` : "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {grant.investigators?.slice(0, 2).map((inv: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{inv.role}</Badge>
                      ))}
                      {grant.investigators?.length > 2 && <Badge variant="secondary" className="text-xs">+{grant.investigators.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {grant.isPublic ? <Badge variant="default" className="bg-green-600"><Eye className="h-3 w-3 mr-1" />Public</Badge> : <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Private</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedGrant(grant); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(grant.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" onClick={handleExportCSV} size="sm"><Download className="h-4 w-4 mr-2" />Export to CSV</Button>
        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredGrants.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      <GrantFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} grant={selectedGrant} onSuccess={fetchGrants} />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the grant entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.size} Grants?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the selected grants.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting}>{isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
