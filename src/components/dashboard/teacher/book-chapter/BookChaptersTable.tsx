"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Loader2, Edit, Trash2, ArrowUpDown, Trash } from "lucide-react";
import { BookChapterFormDialog } from "./BookChapterFormDialog";
import { TablePagination } from "../../TablePagination";
import { exportToCSV } from "@/lib/csvExport";
import { FilterDialog, useFilters } from "./FilterDialog";
import { fetchBookChapters as fetchBookChaptersApi, deleteBookChapter, deleteMultipleBookChapters } from "@/lib/api/teacherApi";
import { Checkbox } from "@/components/ui/checkbox";
export function BookChaptersTable() {
  const router = useRouter();
  const [bookChapters, setBookChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookChapter, setSelectedBookChapter] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  
  const { filters, setFilters, clearFilters } = useFilters();
  const [sortField, setSortField] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBookChapters = async () => {
    setIsLoading(true);
    try {
      const result = await fetchBookChaptersApi();
      setBookChapters(result.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBookChapters(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBookChapter(deleteId);
      fetchBookChapters();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMultipleBookChapters(selectedIds);
      fetchBookChapters();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedChapters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedChapters.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(bookChapters.map(c => c.status).filter(Boolean)));
    return [
      { value: "all", label: "All Statuses" },
      ...statuses.map(s => ({ value: s, label: s }))
    ];
  }, [bookChapters]);

  const visibilityOptions = [
    { value: "all", label: "All Visibility" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const filteredAndSortedChapters = useMemo(() => {
    let filtered = bookChapters.filter(chapter => {
      // Status filtering
      const matchesStatus = !filters.status || chapter.status === filters.status;
      
      // Date filtering (using createdAt as fallback)
      const chapterDate = chapter.createdAt ? new Date(chapter.createdAt) : null;
      const matchesDateFrom = !filters.dateRange?.from || !chapterDate || chapterDate >= filters.dateRange.from;
      const matchesDateTo = !filters.dateRange?.to || !chapterDate || chapterDate <= new Date(filters.dateRange.to.getTime() + 86400000 - 1);
      
      // Visibility filtering
      const matchesVisibility = !filters.visibility || 
        (filters.visibility === "public" && chapter.isPublic) ||
        (filters.visibility === "private" && !chapter.isPublic);
      
      // Author count filtering
      const authorCount = chapter.authors?.length || 0;
      const matchesAuthorCount = !filters.authorCount || 
        (filters.authorCount === "1" && authorCount === 1) ||
        (filters.authorCount === "multiple" && authorCount > 1);
      
      return matchesStatus && matchesDateFrom && matchesDateTo && matchesVisibility && matchesAuthorCount;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "chapterNumber") {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else {
        aVal = aVal?.toString().toLowerCase() || "";
        bVal = bVal?.toString().toLowerCase() || "";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [bookChapters, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedChapters.length / itemsPerPage);
  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedChapters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedChapters, currentPage, itemsPerPage]);

  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedIds([]);
  }, [filters]);

  useEffect(() => {
    setSelectedIds([]);
  }, [sortField, sortOrder, itemsPerPage]);
 
   
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
          <h2 className="text-xl sm:text-2xl font-bold">Book Chapters</h2>
          <p className="text-sm text-muted-foreground">Manage your book chapter publications</p>
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
          <Button onClick={() => exportToCSV(filteredAndSortedChapters, "book_chapters")} variant="outline" className="w-full sm:w-auto bg-green-300 text-black font-semibold hover:bg-green-400 border-green-500 border">
            Export CSV
          </Button>
          <Button onClick={() => { setSelectedBookChapter(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />Add Book Chapter
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <FilterDialog
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          statusOptions={uniqueStatuses}
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
                  checked={selectedIds.length === paginatedChapters.length && paginatedChapters.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[180px]"><Button variant="ghost" onClick={() => handleSort("title")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Title <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[130px]">Authors</TableHead>
              <TableHead className="whitespace-nowrap min-w-[100px]"><Button variant="ghost" onClick={() => handleSort("status")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Status <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[110px]"><Button variant="ghost" onClick={() => handleSort("isbnIssn")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">ISBN/ISSN <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[130px]"><Button variant="ghost" onClick={() => handleSort("registrationFees")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Reg. Fees <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[130px]"><Button variant="ghost" onClick={() => handleSort("reimbursement")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Reimburse. <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="whitespace-nowrap min-w-[100px]"><Button variant="ghost" onClick={() => handleSort("isPublic")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">Visibility <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></Button></TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[80px] sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChapters.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center h-24">{filters.status || filters.dateRange || filters.visibility ? "No book chapters match your filters." : "No book chapters found."}</TableCell></TableRow>
            ) : (
              paginatedChapters.map((chapter) => (
                <TableRow key={chapter.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={selectedIds.includes(chapter.id)}
                      onCheckedChange={() => toggleSelectOne(chapter.id)}
                      aria-label={`Select ${chapter.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium min-w-[180px]">
                    <div className="max-w-[250px] truncate" title={chapter.title}>{chapter.title}</div>
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    {chapter.authors && chapter.authors.length > 0 ? (
                      <div className="text-xs sm:text-sm space-y-1">
                        {chapter.authors.map((author: any, idx: number) => (
                          <div key={idx} className="truncate max-w-[150px]" title={author.teacher?.user?.name}>{author.teacher?.user?.name || "Unknown"}</div>
                        ))}
                      </div>
                    ) : "N/A"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap"><Badge className="text-xs">{chapter.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{chapter.isbnIssn || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{chapter.registrationFees ? `₹${chapter.registrationFees}` : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">{chapter.reimbursement ? `₹${chapter.reimbursement}` : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap"><Badge variant={chapter.isPublic ? "default" : "secondary"} className="text-xs">{chapter.isPublic ? "Public" : "Private"}</Badge></TableCell>
                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedBookChapter(chapter); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteId(chapter.id); setIsDeleteOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSortedChapters.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      <BookChapterFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} bookChapter={selectedBookChapter} onSuccess={fetchBookChapters} />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the book chapter entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Book Chapters?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} book chapter{selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.
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
