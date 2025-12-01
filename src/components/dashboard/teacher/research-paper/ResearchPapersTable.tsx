"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Loader2, Edit, Trash2, ArrowUpDown, Trash, Eye } from "lucide-react";
import { TablePagination } from "../../TablePagination";
import { exportToCSV } from "@/lib/csvExport";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import toast from "react-hot-toast";

export function ResearchPapersTable() {
  const [papers, setPapers] = useState<any[]>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/research-paper");
      setPapers(response.data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch research papers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPapers(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/research-paper/${deleteId}`);
      toast.success("Research paper deleted successfully");
      fetchPapers();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete research paper");
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => axios.delete(`/api/research-paper/${id}`)));
      toast.success(`${selectedIds.length} research papers deleted successfully`);
      fetchPapers();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete research papers");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedPapers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPapers.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(papers.map(p => p.status).filter(Boolean)));
    return [
      { value: "all", label: "All Statuses" },
      ...statuses.map(s => ({ value: s, label: s }))
    ];
  }, [papers]);

  const filteredAndSortedPapers = useMemo(() => {
    let filtered = papers.filter(paper => {
      const matchesStatus = statusFilter === "all" || paper.status === statusFilter;
      return matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "createdAt" || sortField === "submittedAt") {
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
  }, [papers, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedPapers.length / itemsPerPage);
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPapers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPapers, currentPage, itemsPerPage]);

  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedIds([]);
  }, [statusFilter]);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "UNDER_REVIEW":
        return "secondary";
      case "REJECTED":
        return "destructive";
      case "PUBLISHED":
        return "default";
      default:
        return "outline";
    }
  };

  const handleViewPaper = (paperId: string) => {
    router.push(`/dashboard/faculty/paper/${paperId}`);
  };

  const handleUpdateStatus = async (paperId: string, newStatus: string) => {
    try {
      await axios.put(`/api/research-paper/${paperId}`, { status: newStatus });
      toast.success("Status updated successfully");
      fetchPapers();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update status");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Research Papers</h2>
          <p className="text-sm text-muted-foreground">Review and manage student research papers</p>
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
          <Button onClick={() => exportToCSV(filteredAndSortedPapers, "research_papers")} variant="outline" className="w-full sm:w-auto bg-green-300 text-black font-semibold hover:bg-green-400 border-green-500 border">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {uniqueStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  checked={selectedIds.length === paginatedPapers.length && paginatedPapers.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[200px]">
                <Button variant="ghost" onClick={() => handleSort("title")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">
                  Title <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">Student</TableHead>
              <TableHead className="whitespace-nowrap min-w-[130px]">Members</TableHead>
              <TableHead className="whitespace-nowrap min-w-[120px]">
                <Button variant="ghost" onClick={() => handleSort("status")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">
                  Status <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                <Button variant="ghost" onClick={() => handleSort("submittedAt")} className="h-8 px-1 sm:px-2 text-xs sm:text-sm">
                  Submitted <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[120px]">Keywords</TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[80px] sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPapers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  {statusFilter !== "all" ? "No research papers match your filters." : "No research papers found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPapers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={selectedIds.includes(paper.id)}
                      onCheckedChange={() => toggleSelectOne(paper.id)}
                      aria-label={`Select ${paper.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium min-w-[200px]">
                    <div className="max-w-[300px] truncate" title={paper.title}>{paper.title}</div>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="text-xs sm:text-sm truncate max-w-[150px]" title={paper.student?.user?.name}>
                      {paper.student?.user?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    {paper.members && paper.members.length > 0 ? (
                      <div className="text-xs sm:text-sm">
                        {paper.members.length} member{paper.members.length > 1 ? 's' : ''}
                      </div>
                    ) : "No members"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(paper.status)} className="text-xs">
                      {paper.status?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                    {paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString() : "Not submitted"}
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    {paper.keywords && paper.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {paper.keywords.slice(0, 2).map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {paper.keywords.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{paper.keywords.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : "No keywords"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewPaper(paper.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(paper.id, "UNDER_REVIEW")}>
                          Mark Under Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(paper.id, "APPROVED")}>
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(paper.id, "REJECTED")}>
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => { setDeleteId(paper.id); setIsDeleteOpen(true); }} 
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

      <TablePagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        totalItems={filteredAndSortedPapers.length} 
        itemsPerPage={itemsPerPage} 
        onPageChange={setCurrentPage} 
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the research paper entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Research Papers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} research paper{selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.
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
