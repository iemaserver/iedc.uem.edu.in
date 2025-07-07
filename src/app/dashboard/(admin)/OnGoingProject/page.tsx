"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconLoader,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { OnGoingProject, ResearchPaper, User, ReviewerStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowUpDown, Check, Cross, MoreHorizontal, Ticket } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface OnGoingProjectWithAuthor extends OnGoingProject {
  reviewer?: {
    id: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  facultyAdvisors: User[];
  members: User[];
}

export default function DataTableAdmin() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(0);

  const { data: session } = useSession();
  const [data, setData] = React.useState<OnGoingProjectWithAuthor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [assigningReviewer, setAssigningReviewer] = React.useState(false);
  const [reviewers, setReviewers] = React.useState<User[]>([]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.pageIndex + 1, // API expects 1-based page numbers
        limit: pagination.pageSize,
      };
      
      if (debouncedSearchQuery) {
        params.query = debouncedSearchQuery;
      }
      
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      const projects = await axios.get("/api/paper/ongoingProject", { params });
      if (projects) {
        setData(projects.data.data || []);
        setTotalPages(projects.data.pagination.totalPages || 0);
        console.log("Fetched projects for tables:", projects.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, statusFilter]);

  React.useEffect(() => {
    fetchData();
    fetchReviewers();
  }, [fetchData]);

  const fetchReviewers = async () => {
    try {
      const response = await axios.get("/api/user/search?userType=FACULTY");
      setReviewers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching reviewers:", error);
    }
  };
   const DeleteProject = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (!selectedIds.length) {
      toast.error("Please select at least one project to delete.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} project(s)? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const response = await axios.delete(`/api/paper/ongoingProject`, {
        data: { projectIds: selectedIds }, // Fixed: use projectIds instead of paperIds
      });
      console.log("Deleted project(s):", selectedIds);
      toast.success(`Successfully deleted ${selectedIds.length} project(s)`);
      setRowSelection({}); // Clear selection after successful delete
    } catch (error) {
      console.error("Error deleting project(s):", error);
      toast.error("Failed to delete projects. Please try again.");
    } finally {
      setActionLoading(false);
      fetchData();
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (!selectedIds.length) {
      toast.error("Please select at least one project to update.");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(`/api/paper/ongoingProject/admin`, {
        projectIds: selectedIds,
        status: status,
        adminId: session.user.id,
      });
      
      console.log(`Updated ${selectedIds.length} project(s) to ${status}`);
      toast.success(`Successfully updated ${selectedIds.length} project(s) to ${status}`);
      setRowSelection({}); // Clear selection after successful update
    } catch (error: any) {
      console.error("Error updating project status:", error);
      toast.error(error.response?.data?.error || "Failed to update projects. Please try again.");
    } finally {
      setActionLoading(false);
      fetchData();
    }
  };



  const columns: ColumnDef<OnGoingProjectWithAuthor>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      enableHiding: false,
      cell: ({ row }) => (
        <Link
          href={`/paper/${row.original.id}`}
          className="hover:text-blue-500 hover:underline"
        >
          {row.original.title.length > 30
            ? row.original.title.slice(0, 30) + "..."
            : row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <IconChevronDown
            className={`ml-2 transition-transform ${
              column.getIsSorted() === "desc" ? "rotate-180" : ""
            }`}
          />
        </Button>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5 flex items-center gap-1"
        >
          {row.original.status === "PUBLISH" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 w-4 h-4" />
          ) : (
            <IconLoader className="w-4 h-4 animate-spin" />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "reviewerStatus",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reviewer Status
          <IconChevronDown
            className={`ml-2 transition-transform ${
              column.getIsSorted() === "desc" ? "rotate-180" : ""
            }`}
          />
        </Button>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const reviewerStatus = row.original.reviewerStatus;
        const reviewer = row.original.reviewer;
        return (
          <div>
            <Badge
              variant={
                reviewerStatus === "ACCEPTED" 
                  ? "default" 
                  : reviewerStatus === "REJECTED" 
                  ? "destructive" 
                  : "secondary"
              }
              className="mb-1"
            >
              {reviewerStatus || "PENDING"}
            </Badge>
            {reviewer && (
              <div className="text-xs text-muted-foreground">
                by {reviewer.name}
              </div>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "projectLink",
      header: () => <div className="text-left">Project Link</div>,
      cell: ({ row }) => (
        <div className="lowercase">
          <a
            href={row.getValue("projectLink") as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Project
          </a>
        </div>
      ),
    },
    {
      accessorKey: "members",
      header: () => <div className="text-left">Members</div>,
      cell: ({ row }) => {
        const members = row.original.members;
        if (Array.isArray(members)) {
          return (
            <div className="lowercase">
              {members.map((member: any) => member.name || member).join(", ")}
            </div>
          );
        }
        return <div className="lowercase">{String(members || "")}</div>;
      },
    },
    {
      accessorKey: "facultyAdvisors",
      header: () => <div className="text-left">Faculty Advisors</div>,
      cell: ({ row }) => {
        const facultyAdvisors = row.original.facultyAdvisors;
        if (Array.isArray(facultyAdvisors)) {
          return (
            <div className="lowercase">
              {facultyAdvisors  
                .map((advisor: any) => advisor.name || advisor)
                .join(", ")}
            </div>
          );
        }
        return <div className="lowercase">{String(facultyAdvisors || "")}</div>;
      },
    },
    {
      accessorKey: "startDate",
      header: () => <div className="text-left">Start Date</div>,
      cell: ({ row }) => {
        const startDate = row.original.startDate;
        return (
          <div className="lowercase">
           {
            <span>{startDate ? new Date(startDate).toLocaleDateString() : "N/A"}</span>
           }
          </div>
        );
      },
    },
    {
      accessorKey: "endDate",
      header: () => <div className="text-left">End Date</div>,
      cell: ({ row }) => {
        const endDate = row.original.endDate;
        return (
          <div className="lowercase">
            <span>{endDate ? new Date(endDate).toLocaleDateString() : "N/A"}</span>
          </div>
        );
      },
            
    },
    // --- END OF NEW COLUMNS ---
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <ActionsCell
            ongoingProject={row.original}
            fetchData={fetchData}
          />
        );
      },
    },
  ];
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalPages / pagination.pageSize),
    manualPagination: true,
    manualFiltering: true, // Add manual filtering since we're doing server-side search
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
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

  if (!session) return <div>Please log in to view this page.</div>;

  return (
    <Tabs defaultValue="outline" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-2">
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
                .filter(
                  (col) =>
                    col.getCanHide() && typeof col.accessorFn !== "undefined"
                )
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="UPLOAD">Upload</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PUBLISH">Published</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                {table.getRowModel().rows.length ? (
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
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="flex flex-1 items-center gap-4">
            {/* Conditionally show bulk action buttons */}
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  onClick={DeleteProject}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={actionLoading}>
                      Bulk Actions
                      <IconChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => bulkUpdateStatus("ONGOING")}>
                      <Check className="mr-2 h-4 w-4" />
                      Accept Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkUpdateStatus("CANCELLED")}>
                      <Cross className="mr-2 h-4 w-4" />
                      Reject Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkUpdateStatus("PUBLISH")}>
                      <Ticket className="mr-2 h-4 w-4" />
                      Publish Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="text-muted-foreground text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {data.length} row(s) selected.
            </div>
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ActionsCell({
  ongoingProject,
  fetchData,
}: {
  ongoingProject: OnGoingProjectWithAuthor;
  fetchData: () => void;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [reviewerOpen, setReviewerOpen] = React.useState(false);

  const handleAdminAction = async (action: 'accept' | 'reject' | 'publish') => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/paper/ongoingProject/admin`, {
        projectId: ongoingProject.id,
        action: action,
        adminId: session.user.id,
        comments: `Admin ${action}ed the project`,
      });
      
      console.log(`Project ${ongoingProject.id} ${action}ed successfully`);
      toast.success(`Project ${action}ed successfully`);
      fetchData();
    } catch (error: any) {
      console.error(`Error ${action}ing project:`, error);
      toast.error(error.response?.data?.error || `Failed to ${action} project. Please try again.`);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          {loading ? (
            <IconLoader className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAdminAction('accept')} disabled={loading}>
          <Ticket className="mr-2 h-4 w-4" />
          Accept Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAdminAction('reject')} disabled={loading}>
          <Cross className="mr-2 h-4 w-4" />
          Reject Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAdminAction('publish')} disabled={loading}>
          <Check className="mr-2 h-4 w-4" />
          Publish Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
