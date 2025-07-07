"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { OnGoingProject, ReviewerStatus } from "@prisma/client";

type OnGoingProjectWithMembers = OnGoingProject & {
  members: { id: string; name: string; email: string }[];
  facultyAdvisors: { id: string; name: string; email: string }[];
  reviewer?: { id: string; name: string; email: string } | null;
};

export default function FacultyOngoingProjectReview() {
  const { data: session } = useSession();
  const [data, setData] = React.useState<OnGoingProjectWithMembers[]>([]);
  const [acceptedProjects, setAcceptedProjects] = React.useState<OnGoingProjectWithMembers[]>([]);
  const [needsUpdateProjects, setNeedsUpdateProjects] = React.useState<OnGoingProjectWithMembers[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get("/api/paper/ongoingProject", {
        params: { 
          query: "",
          page: 1,
          limit: 100, // Get all projects for filtering
        },
      });
      
      const allProjects: OnGoingProjectWithMembers[] = response.data.data;
      
      // Filter projects where current user is the reviewer
      const reviewerProjects = allProjects.filter(p => p.reviewer?.id === session.user.id);
      
      setData(reviewerProjects.filter(p => p.reviewerStatus === ReviewerStatus.PENDING));
      setAcceptedProjects(reviewerProjects.filter(p => p.reviewerStatus === ReviewerStatus.ACCEPTED));
      setNeedsUpdateProjects(reviewerProjects.filter(p => p.reviewerStatus === ReviewerStatus.NEEDS_UPDATES));
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const updateProjectStatus = async (
    projectId: string,
    reviewerStatus: ReviewerStatus,
    updateRequest?: string
  ) => {
    try {
      const endpoint = reviewerStatus === ReviewerStatus.NEEDS_UPDATES 
        ? "/api/paper/ongoingProject/reviewer-flag"
        : "/api/paper/ongoingProject";
        
      const payload = reviewerStatus === ReviewerStatus.NEEDS_UPDATES
        ? { projectId, updateRequest }
        : { projectId, reviewerStatus };

      await axios.put(endpoint, payload);
      toast.success("Project status updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating project status:", error);
      toast.error("Failed to update project status");
    }
  };

  const getStatusBadge = (status: ReviewerStatus) => {
    switch (status) {
      case ReviewerStatus.PENDING:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case ReviewerStatus.ACCEPTED:
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case ReviewerStatus.REJECTED:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case ReviewerStatus.NEEDS_UPDATES:
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Needs Updates</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns: ColumnDef<OnGoingProjectWithMembers>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: () => <div className="text-left">Project Title</div>,
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return <div className="font-medium">{title.length > 40 ? title.slice(0, 40) + "..." : title}</div>;
      },
    },
    {
      accessorKey: "projectType",
      header: () => <div className="text-left">Type</div>,
      cell: ({ row }) => {
        const type = row.getValue("projectType") as string;
        return <Badge variant="outline">{type}</Badge>;
      },
    },
    {
      accessorKey: "members",
      header: () => <div className="text-left">Team Members</div>,
      cell: ({ row }) => {
        const members = row.getValue("members") as { name: string }[];
        return (
          <div className="text-sm">
            {members.slice(0, 2).map(m => m.name).join(", ")}
            {members.length > 2 && ` +${members.length - 2} more`}
          </div>
        );
      },
    },
    {
      accessorKey: "reviewerStatus",
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("reviewerStatus") as ReviewerStatus;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <div className="text-left">Submitted</div>,
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        
        if (project.reviewerStatus === ReviewerStatus.PENDING) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Review Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => updateProjectStatus(project.id, ReviewerStatus.ACCEPTED)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    const updateRequest = prompt("Enter update request message:");
                    if (updateRequest) {
                      updateProjectStatus(project.id, ReviewerStatus.NEEDS_UPDATES, updateRequest);
                    }
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Request Updates
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateProjectStatus(project.id, ReviewerStatus.REJECTED)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        return <span className="text-muted-foreground text-sm">No actions</span>;
      },
    },
  ], []);

  const acceptedColumns: ColumnDef<OnGoingProjectWithMembers>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: () => <div className="text-left">Project Title</div>,
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return <div className="font-medium">{title.length > 40 ? title.slice(0, 40) + "..." : title}</div>;
      },
    },
    {
      accessorKey: "projectType",
      header: () => <div className="text-left">Type</div>,
      cell: ({ row }) => {
        const type = row.getValue("projectType") as string;
        return <Badge variant="outline">{type}</Badge>;
      },
    },
    {
      accessorKey: "reviewerStatus",
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("reviewerStatus") as ReviewerStatus;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: "reviewedAt",
      header: () => <div className="text-left">Reviewed At</div>,
      cell: ({ row }) => {
        const date = row.getValue("reviewedAt") as string;
        return date ? <div className="text-sm">{new Date(date).toLocaleDateString()}</div> : "-";
      },
    },
  ], []);

  const needsUpdateColumns: ColumnDef<OnGoingProjectWithMembers>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: () => <div className="text-left">Project Title</div>,
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return <div className="font-medium">{title.length > 40 ? title.slice(0, 40) + "..." : title}</div>;
      },
    },
    {
      accessorKey: "updateRequest",
      header: () => <div className="text-left">Update Request</div>,
      cell: ({ row }) => {
        const request = row.getValue("updateRequest") as string;
        return request ? <div className="text-sm">{request.length > 50 ? request.slice(0, 50) + "..." : request}</div> : "-";
      },
    },
    {
      accessorKey: "needsUpdate",
      header: () => <div className="text-left">Student Response</div>,
      cell: ({ row }) => {
        const needsUpdate = row.getValue("needsUpdate") as boolean;
        const studentUpdatedAt = row.original.studentUpdatedAt;
        
        if (!needsUpdate && studentUpdatedAt) {
          return <Badge variant="default">Updated</Badge>;
        } else if (needsUpdate) {
          return <Badge variant="destructive">Pending</Badge>;
        }
        return <Badge variant="secondary">No Response</Badge>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        
        if (!project.needsUpdate && project.studentUpdatedAt) {
          // Student has responded, reviewer can now re-review
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Re-review Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => updateProjectStatus(project.id, ReviewerStatus.ACCEPTED)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    const updateRequest = prompt("Enter new update request message:");
                    if (updateRequest) {
                      updateProjectStatus(project.id, ReviewerStatus.NEEDS_UPDATES, updateRequest);
                    }
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Request More Updates
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateProjectStatus(project.id, ReviewerStatus.REJECTED)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        return <span className="text-muted-foreground text-sm">Waiting for student</span>;
      },
    },
  ], []);

  React.useEffect(() => {
    if (session?.user?.id) fetchData();
  }, [fetchData, session?.user?.id]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const acceptedTable = useReactTable({
    data: acceptedProjects,
    columns: acceptedColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const needsUpdateTable = useReactTable({
    data: needsUpdateProjects,
    columns: needsUpdateColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full h-fit flex flex-col justify-between items-center px-2">
      <div className="w-full flex flex-col items-center mb-6">
        <h1 className="dark:text-white text-black text-2xl font-bold text-center sm:text-3xl mb-2">
          Ongoing Project Reviews
        </h1>
        <p className="text-muted-foreground text-center">
          Review and manage ongoing projects assigned to you
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full flex-col gap-6">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="relative">
            Pending Reviews
            {data.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {data.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="needs-updates" className="relative">
            Needs Updates
            {needsUpdateProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {needsUpdateProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted Projects
          </TabsTrigger>
        </TabsList>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide() && col.accessorFn)
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                      className="capitalize"
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-hidden rounded-lg border">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                        No pending reviews.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Needs Updates Tab */}
        <TabsContent value="needs-updates" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="overflow-hidden rounded-lg border">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {needsUpdateTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {needsUpdateTable.getRowModel().rows.length ? (
                    needsUpdateTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={needsUpdateTable.getAllColumns().length} className="h-24 text-center">
                        No projects needing updates.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Accepted Projects Tab */}
        <TabsContent value="accepted" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="overflow-hidden rounded-lg border">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {acceptedTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {acceptedTable.getRowModel().rows.length ? (
                    acceptedTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={acceptedTable.getAllColumns().length} className="h-24 text-center">
                        No accepted projects.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
