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
import { JournalFormDialog } from "./JournalFormDialog";
import { FilterDialog } from "./FilterDialog";
import { TablePagination } from "../../TablePagination";
import { deleteMultipleJournals } from "@/lib/api/teacherApi";
import { exportToCSV } from "@/lib/csvExport";
import toast from "react-hot-toast";

export function JournalsTable() {
  const [journals, setJournals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
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
    authorCount: "all",
    status: "all",
  });

  const fetchJournals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/journal");
      const result = await response.json();
      setJournals(result.data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch journals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJournals(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/teacher/journal/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Journal deleted successfully");
        fetchJournals();
        setIsDeleteOpen(false);
        setDeleteId(null);
      } else {
        toast.error("Failed to delete journal");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete journal");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await deleteMultipleJournals(Array.from(selectedIds));
      toast.success(`${selectedIds.size} journals deleted successfully`);
      fetchJournals();
      setIsBulkDeleteOpen(false);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error(error.message || "Failed to delete journals");
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
    if (selectedIds.size === paginatedJournals.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedJournals.map(j => j.id)));
  };

  const filteredJournals = useMemo(() => {
    let filtered = journals.filter(journal => {
      const matchesSearch = searchTerm === "" || 
        journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.journalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.publisher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.impactFactor?.toString().includes(searchTerm);
      
      const matchesVisibility = filters.visibility === "all" || 
        (filters.visibility === "public" && journal.isPublic) ||
        (filters.visibility === "private" && !journal.isPublic);

      const matchesStatus = filters.status === "all" || journal.status === filters.status;

      const authorCount = journal.authors?.length || 0;
      const matchesAuthorCount = filters.authorCount === "all" ||
        (filters.authorCount === "1" && authorCount === 1) ||
        (filters.authorCount === "2-3" && authorCount >= 2 && authorCount <= 3) ||
        (filters.authorCount === "4+" && authorCount >= 4);
      
      const journalDate = journal.statusDate ? new Date(journal.statusDate) : null;
      const matchesDateFrom = !filters.dateRange.from || !journalDate || journalDate >= new Date(filters.dateRange.from);
      const matchesDateTo = !filters.dateRange.to || !journalDate || journalDate <= new Date(filters.dateRange.to + "T23:59:59");
      
      return matchesSearch && matchesVisibility && matchesStatus && matchesAuthorCount && matchesDateFrom && matchesDateTo;
    });
    return filtered;
  }, [journals, searchTerm, filters]);

  const totalPages = Math.ceil(filteredJournals.length / itemsPerPage);
  const paginatedJournals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJournals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJournals, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

  const handleExportCSV = () => {
    const selectedJournals = journals.filter(j => selectedIds.has(j.id));
    const dataToExport = selectedJournals.length > 0 ? selectedJournals : filteredJournals;
    
    const csvData = dataToExport.map(journal => ({
      Title: journal.title,
      "Journal Name": journal.journalName || "",
      "Type of Journal": journal.typeOfJournal || "",
      "Index": journal.indexOfJournal || "",
      "Impact Factor": journal.impactFactor || "",
      "Impact Factor Date": journal.impactFactorDate ? new Date(journal.impactFactorDate).toLocaleDateString() : "",
      Publisher: journal.publisher || "",
      Status: journal.status || "",
      "Status Date": journal.statusDate ? new Date(journal.statusDate).toLocaleDateString() : "",
      "DOI/Link": journal.paperLinkDOI || "",
      "Registration Fees": journal.registrationFees || "",
      "Reimbursement Status": journal.reimbursementStatus || "",
      "Reimbursement Date": journal.reimbursementDate ? new Date(journal.reimbursementDate).toLocaleDateString() : "",
      Visibility: journal.isPublic ? "Public" : "Private",
      "Author Count": journal.authors?.length || 0,
    }));
    
    exportToCSV(csvData, `journals_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} journals to CSV`);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Journal Publications</h2>
          <p className="text-muted-foreground">Track your journal publications</p>
        </div>
        <Button onClick={() => { setSelectedJournal(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Journal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, journal name, publisher, or impact factor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                <Checkbox checked={selectedIds.size === paginatedJournals.length && paginatedJournals.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="min-w-[250px] sticky left-12 bg-background z-10">Title</TableHead>
              <TableHead className="min-w-[180px]">Journal Name</TableHead>
              <TableHead className="min-w-[120px]">Impact Factor</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[130px]">Status Date</TableHead>
              <TableHead className="min-w-[120px]">Authors</TableHead>
              <TableHead className="min-w-[100px]">Visibility</TableHead>
              <TableHead className="text-right whitespace-nowrap sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJournals.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center h-24">{searchTerm || filters.visibility !== "all" || filters.status !== "all" ? "No journals match your filters." : "No journals found."}</TableCell></TableRow>
            ) : (
              paginatedJournals.map((journal) => (
                <TableRow key={journal.id} className={selectedIds.has(journal.id) ? "bg-muted/50" : ""}>
                  <TableCell className="sticky left-0 bg-background">
                    <Checkbox checked={selectedIds.has(journal.id)} onCheckedChange={() => toggleSelection(journal.id)} />
                  </TableCell>
                  <TableCell className="font-medium sticky left-12 bg-background">{journal.title}</TableCell>
                  <TableCell className="whitespace-nowrap">{journal.journalName}</TableCell>
                  <TableCell className="whitespace-nowrap">{journal.impactFactor || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap"><Badge>{journal.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(journal.statusDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {journal.authors?.slice(0, 2).map((author: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{author.teacher?.user?.name || "Author"}</Badge>
                      ))}
                      {journal.authors?.length > 2 && <Badge variant="secondary" className="text-xs">+{journal.authors.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {journal.isPublic ? <Badge variant="default" className="bg-green-600"><Eye className="h-3 w-3 mr-1" />Public</Badge> : <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Private</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedJournal(journal); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(journal.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredJournals.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      <JournalFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} journal={selectedJournal} onSuccess={fetchJournals} />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the journal entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.size} Journals?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the selected journals.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting}>{isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
