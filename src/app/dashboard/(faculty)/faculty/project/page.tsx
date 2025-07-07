"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

interface OngoingProject {
  id: string;
  title: string;
  description: string;
  status: string;
  reviewerStatus: string;
  projectType?: string;
  projectTags: string[];
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  facultyAdvisors: ProjectMember[];
  reviewer?: ProjectMember;
  reviewerComments?: string;
  needsUpdate: boolean;
  updateRequest?: string;
  updateDeadline?: string;
}

export default function FacultyProjectDashboard() {
  const { data: session } = useSession();
  const [advisingProjects, setAdvisingProjects] = useState<OngoingProject[]>([]);
  const [reviewingProjects, setReviewingProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Table state for advising projects
  const [advisingSorting, setAdvisingSorting] = useState<SortingState>([]);
  const [advisingColumnFilters, setAdvisingColumnFilters] = useState<ColumnFiltersState>([]);
  const [advisingColumnVisibility, setAdvisingColumnVisibility] = useState<VisibilityState>({});
  const [advisingPagination, setAdvisingPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Table state for reviewing projects
  const [reviewingSorting, setReviewingSorting] = useState<SortingState>([]);
  const [reviewingColumnFilters, setReviewingColumnFilters] = useState<ColumnFiltersState>([]);
  const [reviewingColumnVisibility, setReviewingColumnVisibility] = useState<VisibilityState>({});
  const [reviewingPagination, setReviewingPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Fetch projects where user is faculty advisor
      const advisingResponse = await axios.get("/api/paper/ongoingProject", {
        params: {
          facultyAdvisor: session.user.id,
          limit: 100,
        },
      });

      // Fetch projects where user is reviewer
      const reviewingResponse = await axios.get("/api/paper/ongoingProject/reviewer", {
        params: {
          reviewerId: session.user.id,
        },
      });

      setAdvisingProjects(advisingResponse.data.data || []);
      setReviewingProjects(reviewingResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [session?.user?.id]);

  const handleReviewerAction = async (projectId: string, action: "approve" | "reject", comments?: string) => {
    if (!session?.user?.id) return;

    try {
      await axios.post("/api/paper/ongoingProject/reviewer", {
        projectId,
        reviewerId: session.user.id,
        action,
        comments,
      });

      toast.success(`Project ${action}d successfully`);
      fetchProjects();
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      toast.error(`Failed to ${action} project`);
    }
  };

  const requestUpdates = async (projectId: string, updateRequest: string, deadline?: string) => {
    if (!session?.user?.id) return;

    try {
      await axios.put("/api/paper/ongoingProject/reviewer-flag", {
        projectId,
        reviewerId: session.user.id,
        updateRequest,
        deadline,
      });

      toast.success("Update request sent to student");
      fetchProjects();
    } catch (error) {
      console.error("Error requesting updates:", error);
      toast.error("Failed to request updates");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPLOAD: { variant: "secondary" as const, label: "Upload" },
      ONGOING: { variant: "default" as const, label: "Ongoing" },
      COMPLETED: { variant: "default" as const, label: "Completed" },
      PUBLISH: { variant: "default" as const, label: "Published" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReviewerStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { variant: "outline" as const, label: "Pending Review" },
      ACCEPTED: { variant: "default" as const, label: "Approved" },
      REJECTED: { variant: "destructive" as const, label: "Rejected" },
      NEEDS_UPDATES: { variant: "secondary" as const, label: "Needs Updates" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const advisingColumns: ColumnDef<OngoingProject>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => {
        const members = row.getValue("members") as ProjectMember[];
        return (
          <div className="text-sm">
            {members.slice(0, 2).map(member => member.name).join(", ")}
            {members.length > 2 && ` +${members.length - 2} more`}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "reviewerStatus",
      header: "Review Status",
      cell: ({ row }) => getReviewerStatusBadge(row.getValue("reviewerStatus")),
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => {
        const reviewer = row.getValue("reviewer") as ProjectMember;
        return <div className="text-sm">{reviewer?.name || "Not assigned"}</div>;
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Students
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const reviewingColumns: ColumnDef<OngoingProject>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "members",
      header: "Students",
      cell: ({ row }) => {
        const members = row.getValue("members") as ProjectMember[];
        return (
          <div className="text-sm">
            {members.slice(0, 2).map(member => member.name).join(", ")}
            {members.length > 2 && ` +${members.length - 2} more`}
          </div>
        );
      },
    },
    {
      accessorKey: "reviewerStatus",
      header: "Review Status",
      cell: ({ row }) => getReviewerStatusBadge(row.getValue("reviewerStatus")),
    },
    {
      accessorKey: "needsUpdate",
      header: "Update Needed",
      cell: ({ row }) => {
        const needsUpdate = row.getValue("needsUpdate") as boolean;
        return needsUpdate ? (
          <Badge variant="secondary">Updates Requested</Badge>
        ) : (
          <span className="text-sm text-gray-500">No</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        const isPending = project.reviewerStatus === "PENDING";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              {isPending && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleReviewerAction(project.id, "approve", "Project approved by reviewer")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleReviewerAction(project.id, "reject", "Project rejected by reviewer")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Reject Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const updateRequest = prompt("Enter update request for students:");
                      if (updateRequest) {
                        requestUpdates(project.id, updateRequest);
                      }
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Updates
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const advisingTable = useReactTable({
    data: advisingProjects,
    columns: advisingColumns,
    onSortingChange: setAdvisingSorting,
    onColumnFiltersChange: setAdvisingColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setAdvisingColumnVisibility,
    onPaginationChange: setAdvisingPagination,
    state: {
      sorting: advisingSorting,
      columnFilters: advisingColumnFilters,
      columnVisibility: advisingColumnVisibility,
      pagination: advisingPagination,
    },
  });

  const reviewingTable = useReactTable({
    data: reviewingProjects,
    columns: reviewingColumns,
    onSortingChange: setReviewingSorting,
    onColumnFiltersChange: setReviewingColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setReviewingColumnVisibility,
    onPaginationChange: setReviewingPagination,
    state: {
      sorting: reviewingSorting,
      columnFilters: reviewingColumnFilters,
      columnVisibility: reviewingColumnVisibility,
      pagination: reviewingPagination,
    },
  });

  if (!session || session.user.userType === "STUDENT") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Access denied. Faculty privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Faculty Project Dashboard</h1>
        <Button onClick={fetchProjects} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Tabs defaultValue="advising" className="w-full">
        <TabsList>
          <TabsTrigger value="advising">
            Projects I'm Advising ({advisingProjects.length})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            Projects I'm Reviewing ({reviewingProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advising" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="UPLOAD">Upload</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PUBLISH">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {advisingTable.getHeaderGroups().map((headerGroup) => (
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
                {advisingTable.getRowModel().rows?.length ? (
                  advisingTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                    <TableCell
                      colSpan={advisingColumns.length}
                      className="h-24 text-center"
                    >
                      No projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {advisingTable.getFilteredRowModel().rows.length} project(s) found.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => advisingTable.previousPage()}
                disabled={!advisingTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => advisingTable.nextPage()}
                disabled={!advisingTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviewing" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {reviewingTable.getHeaderGroups().map((headerGroup) => (
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
                {reviewingTable.getRowModel().rows?.length ? (
                  reviewingTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                    <TableCell
                      colSpan={reviewingColumns.length}
                      className="h-24 text-center"
                    >
                      No projects assigned for review.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {reviewingTable.getFilteredRowModel().rows.length} project(s) to review.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reviewingTable.previousPage()}
                disabled={!reviewingTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reviewingTable.nextPage()}
                disabled={!reviewingTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
