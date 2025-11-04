"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  RefreshCw,
  Edit,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  X,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  BookOpen,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResearchPaper {
  id: number;
  title: string;
  authors: string;
  journal: string;
  doi: string;
  status: "pending" | "accepted" | "rejected";
  submissionDate: string;
  studentId: string;
  studentName: string;
  abstract?: string;
  keywords?: string;
  pdfUrl?: string;
  rejectionReason?: string;
}

const TeacherResearchPaperPage = () => {
  const [data, setData] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [reviewAction, setReviewAction] = useState<"accept" | "reject">("accept");
  const [reviewComments, setReviewComments] = useState("");

  const fetchResearchPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teacher/research-paper");
      if (!response.ok) throw new Error("Failed to fetch research papers");
      const result = await response.json();
      
      // Ensure we always set an array
      const papers = Array.isArray(result.data) ? result.data : [];
      setData(papers);
    } catch (error) {
      console.error("Error fetching research papers:", error);
      toast.error("Failed to fetch research papers");
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchPapers();
  }, []);

  const handleReview = async () => {
    if (!selectedPaper) return;

    try {
      const response = await fetch(`/api/teacher/research-paper/${selectedPaper.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewAction,
          reviewComments: reviewComments,
        }),
      });

      if (!response.ok) throw new Error("Failed to update research paper");

      toast.success(`Research paper ${reviewAction}ed successfully`);
      setReviewDialogOpen(false);
      setSelectedPaper(null);
      setReviewComments("");
      fetchResearchPapers();
    } catch (error) {
      console.error("Error updating research paper:", error);
      toast.error("Failed to update research paper");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<ResearchPaper>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <FileText className="mr-2 h-4 w-4" />
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.title}</div>
          <div className="text-sm text-muted-foreground truncate">
            by {row.original.authors}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <User className="mr-2 h-4 w-4" />
          Student
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.studentName}</div>
          <div className="text-sm text-muted-foreground">{row.original.studentId}</div>
        </div>
      ),
    },
    {
      accessorKey: "journal",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Journal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.journal}>
          {row.original.journal}
        </div>
      ),
    },
    {
      accessorKey: "submissionDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Submitted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.submissionDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const paper = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPaper(paper);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {paper.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedPaper(paper);
                      setReviewAction("accept");
                      setReviewDialogOpen(true);
                    }}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedPaper(paper);
                      setReviewAction("reject");
                      setReviewDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  const statusCounts = {
    pending: data.filter(p => p.status === "pending").length,
    accepted: data.filter(p => p.status === "accepted").length,
    rejected: data.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Papers</h1>
          <p className="text-muted-foreground">
            Review and manage student research paper submissions
          </p>
        </div>
        <Button onClick={fetchResearchPapers} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string[])?.join(",") || "all"
          }
          onValueChange={(value) => {
            if (value === "all") {
              table.getColumn("status")?.setFilterValue(undefined);
            } else {
              table.getColumn("status")?.setFilterValue([value]);
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              View
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No research papers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Paper Details</DialogTitle>
            <DialogDescription>
              Review the complete details of this research paper submission.
            </DialogDescription>
          </DialogHeader>
          {selectedPaper && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Title</Label>
                  <p className="text-sm mt-1">{selectedPaper.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPaper.status)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Authors</Label>
                  <p className="text-sm mt-1">{selectedPaper.authors}</p>
                </div>
                <div>
                  <Label className="font-semibold">Journal</Label>
                  <p className="text-sm mt-1">{selectedPaper.journal}</p>
                </div>
                <div>
                  <Label className="font-semibold">Student</Label>
                  <p className="text-sm mt-1">{selectedPaper.studentName} ({selectedPaper.studentId})</p>
                </div>
                <div>
                  <Label className="font-semibold">Submission Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedPaper.submissionDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedPaper.doi && (
                  <div className="col-span-2">
                    <Label className="font-semibold">DOI</Label>
                    <p className="text-sm mt-1">{selectedPaper.doi}</p>
                  </div>
                )}
                {selectedPaper.keywords && (
                  <div className="col-span-2">
                    <Label className="font-semibold">Keywords</Label>
                    <p className="text-sm mt-1">{selectedPaper.keywords}</p>
                  </div>
                )}
              </div>
              {selectedPaper.abstract && (
                <div>
                  <Label className="font-semibold">Abstract</Label>
                  <p className="text-sm mt-1 leading-relaxed">{selectedPaper.abstract}</p>
                </div>
              )}
              {selectedPaper.rejectionReason && (
                <div>
                  <Label className="font-semibold text-red-600">Rejection Reason</Label>
                  <p className="text-sm mt-1 text-red-600">{selectedPaper.rejectionReason}</p>
                </div>
              )}
              {selectedPaper.pdfUrl && (
                <div>
                  <Label className="font-semibold">Document</Label>
                  <div className="mt-1">
                    <Button variant="outline" asChild>
                      <a href={selectedPaper.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View PDF
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "accept" ? "Accept" : "Reject"} Research Paper
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "accept"
                ? "Accept this research paper submission."
                : "Provide a reason for rejecting this research paper."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPaper && (
              <div>
                <Label className="font-semibold">Paper Title</Label>
                <p className="text-sm mt-1">{selectedPaper.title}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reviewComments">
                {reviewAction === "accept" ? "Comments (Optional)" : "Rejection Reason"}
              </Label>
              <Textarea
                id="reviewComments"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={
                  reviewAction === "accept"
                    ? "Add any comments for the student..."
                    : "Please provide a reason for rejection..."
                }
                required={reviewAction === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setReviewComments("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              variant={reviewAction === "accept" ? "default" : "destructive"}
              disabled={reviewAction === "reject" && !reviewComments.trim()}
            >
              {reviewAction === "accept" ? "Accept Paper" : "Reject Paper"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherResearchPaperPage;