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
  Briefcase,
  User,
  Calendar,
  DollarSign,
  MapPin,
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
import axios from "axios";
import { useSession } from "next-auth/react";

interface OngoingProject {
  id: string;
  title: string;
  description: string;
  projectType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  budget?: number;
  fundingAgency?: string;
  submissionDate: string;
  objectives?: string;
  methodology?: string;
  expectedOutcomes?: string;
  rejectionReason?: string;
  proposalUrl?: string;
  student: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  facultyAdvisors: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
}

const TeacherOngoingProjectPage = () => {
  const {data:session} = useSession();
  const teacherId = session?.user?.id;
  const [data, setData] = useState<OngoingProject[]>([]);
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
  const [selectedProject, setSelectedProject] = useState<OngoingProject | null>(null);
  const [reviewAction, setReviewAction] = useState<"accept" | "reject">("accept");
  const [reviewComments, setReviewComments] = useState("");

  const fetchOngoingProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/teacher/ongoing-projects");
      
      // The API returns { data: [...], meta: {...} }
      // So we need to access response.data.data for the actual projects array
      const projects = Array.isArray(response.data?.data) ? response.data.data : [];
      setData(projects);
    } catch (error) {
      console.error("Error fetching ongoing projects:", error);
      toast.error("Failed to fetch ongoing projects");
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoingProjects();
  }, []);

  const handleReview = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/teacher/ongoing-projects/${selectedProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewAction === "accept" ? "APPROVED" : "REJECTED",
          reviewComments: reviewComments,
        }),
      });

      if (!response.ok) throw new Error("Failed to update project");

      toast.success(`Project ${reviewAction}ed successfully`);
      setReviewDialogOpen(false);
      setSelectedProject(null);
      setReviewComments("");
      fetchOngoingProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: ColumnDef<OngoingProject>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Project Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.title}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.projectType}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "student",
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
          <div className="font-medium">{row.original.student.user.fullName}</div>
          <div className="text-sm text-muted-foreground">{row.original.student.user.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const project = row.original;
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const durationMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        return (
          <div className="text-sm">
            <div>{durationMonths} months</div>
            <div className="text-muted-foreground">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Budget
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(row.original.budget)}</div>
          {row.original.fundingAgency && (
            <div className="text-muted-foreground truncate max-w-24" title={row.original.fundingAgency}>
              {row.original.fundingAgency}
            </div>
          )}
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
        const project = row.original;
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
                  setSelectedProject(project);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {project.status === "PENDING" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProject(project);
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
                      setSelectedProject(project);
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
    pending: data.filter(p => p.status === "PENDING").length,
    accepted: data.filter(p => p.status === "APPROVED").length,
    rejected: data.filter(p => p.status === "REJECTED").length,
  };

  const totalBudget = data
    .filter(p => p.status === "APPROVED" && p.budget)
    .reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ongoing Projects</h1>
          <p className="text-muted-foreground">
            Review and manage student ongoing project submissions
          </p>
        </div>
        <Button onClick={fetchOngoingProjects} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Accepted projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
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
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
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
                      No ongoing projects found.
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
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Review the complete details of this ongoing project submission.
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Project Title</Label>
                  <p className="text-sm mt-1">{selectedProject.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Project Type</Label>
                  <p className="text-sm mt-1">{selectedProject.projectType}</p>
                </div>
                <div>
                  <Label className="font-semibold">Student</Label>
                  <p className="text-sm mt-1">{selectedProject.student.user.fullName} ({selectedProject.student.user.email})</p>
                </div>
                <div>
                  <Label className="font-semibold">Duration</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Submission Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedProject.submissionDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedProject.budget && (
                  <div>
                    <Label className="font-semibold">Budget</Label>
                    <p className="text-sm mt-1">{formatCurrency(selectedProject.budget)}</p>
                  </div>
                )}
                {selectedProject.fundingAgency && (
                  <div>
                    <Label className="font-semibold">Funding Agency</Label>
                    <p className="text-sm mt-1">{selectedProject.fundingAgency}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="font-semibold">Description</Label>
                <p className="text-sm mt-1 leading-relaxed">{selectedProject.description}</p>
              </div>
              {selectedProject.objectives && (
                <div>
                  <Label className="font-semibold">Objectives</Label>
                  <p className="text-sm mt-1 leading-relaxed">{selectedProject.objectives}</p>
                </div>
              )}
              {selectedProject.methodology && (
                <div>
                  <Label className="font-semibold">Methodology</Label>
                  <p className="text-sm mt-1 leading-relaxed">{selectedProject.methodology}</p>
                </div>
              )}
              {selectedProject.expectedOutcomes && (
                <div>
                  <Label className="font-semibold">Expected Outcomes</Label>
                  <p className="text-sm mt-1 leading-relaxed">{selectedProject.expectedOutcomes}</p>
                </div>
              )}
              {selectedProject.rejectionReason && (
                <div>
                  <Label className="font-semibold text-red-600">Rejection Reason</Label>
                  <p className="text-sm mt-1 text-red-600">{selectedProject.rejectionReason}</p>
                </div>
              )}
              {selectedProject.proposalUrl && (
                <div>
                  <Label className="font-semibold">Proposal Document</Label>
                  <div className="mt-1">
                    <Button variant="outline" asChild>
                      <a href={selectedProject.proposalUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Proposal
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
              {reviewAction === "accept" ? "Accept" : "Reject"} Project
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "accept"
                ? "Accept this ongoing project submission."
                : "Provide a reason for rejecting this project."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProject && (
              <div>
                <Label className="font-semibold">Project Title</Label>
                <p className="text-sm mt-1">{selectedProject.title}</p>
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
              {reviewAction === "accept" ? "Accept Project" : "Reject Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherOngoingProjectPage;