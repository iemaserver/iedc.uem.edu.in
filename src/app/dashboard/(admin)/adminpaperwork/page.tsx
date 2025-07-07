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
import { ResearchPaper, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowUpDown,
  Check,
  Cross,
  MoreHorizontal,
  Ticket,
} from "lucide-react";
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

interface ResearchPaperWithReviewer extends ResearchPaper {
  reviewer: {
    id: string | null;
    name?: string | null;
    email?: string | null;
  };
  author: User[] | string;
  facultyAdvisors?: User[] | string;
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
  const [data, setData] = React.useState<ResearchPaperWithReviewer[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");

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
      const papers = await axios.get("/api/paper/researchPaper", {
        params: {
          page: pagination.pageIndex + 1, // API expects 1-based page numbers
          limit: pagination.pageSize,
          query: debouncedSearchQuery || undefined, // Include search query
        },
      });
      if (papers) {
        setData(papers.data.data || []);
        setTotalPages(papers.data.pagination.totalPages || 0);
        console.log("Fetched papers for tables:", papers.data);
      }
    } catch (error) {
      console.error("Error fetching papers:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

 const DeletePaper = async () => {
  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original.id);

  if (!selectedIds.length) {
    toast.error("Please select at least one paper to delete.");
    return;
  }

  // Add confirmation dialog
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${selectedIds.length} paper(s)? This action cannot be undone.`
  );
  
  if (!confirmDelete) return;

  try {
    const response = await axios.delete(`/api/paper/researchPaper`, {
      data: { paperIds: selectedIds },
    });
    console.log("Deleted paper(s):", selectedIds);
    toast.success(`Successfully deleted ${selectedIds.length} paper(s)`);
    setRowSelection({}); // Clear selection after successful delete
  } catch (error) {
    console.error("Error deleting paper(s):", error);
    toast.error("Failed to delete papers. Please try again.");
  } finally {
    fetchData();
  }
};


  const columns: ColumnDef<ResearchPaperWithReviewer>[] = [
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
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5 flex items-center gap-1"
        >

          {row.original.reviewerStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "reviewer",
      header: () => <div className="text-left"> Faculty Reviewer</div>,
      cell: ({ row }) => {
        const reviewer = row.original.reviewer.name || "Not Assigned";
        return <div className="lowercase">{reviewer}</div>;
      },
    },
  
    {
      accessorKey: "filePath",
      header: () => <div className="text-left">Paper Link</div>,
      cell: ({ row }) => (
        <div className="lowercase">
          <a
            href={row.getValue("filePath")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Paper
          </a>
        </div>
      ),
    },
    {
      accessorKey: "authors",
      header: () => <div className="text-left">Authors</div>,
      cell: ({ row }) => {
        const authors = row.original.author;
        if (Array.isArray(authors)) {
          return (
            <div className="lowercase">
              {authors.map((author: any) => author.name || author).join(", ")}
            </div>
          );
        }
        return <div className="lowercase">{String(authors || "")}</div>;
      },
    },
    {
      accessorKey: "facultyAdvisor",
      header: () => <div className="text-left">Faculty Advisor</div>,
      cell: ({ row }) => {
        const facultyAdvisor = row.original.facultyAdvisors;
        if (Array.isArray(facultyAdvisor)) {
          return (
            <div className="lowercase">
              {facultyAdvisor
                .map((advisor: any) => advisor.name || advisor)
                .join(", ")}
            </div>
          );
        }
        return <div className="lowercase">{String(facultyAdvisor || "")}</div>;
      },
    },
    
    // --- END OF NEW COLUMNS ---
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return <ActionsCell paper={row.original} fetchData={fetchData} />;
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
              .filter((col) => col.getCanHide())
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
        <Input
          placeholder="Search by title"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Reset to first page when searching
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
          }}
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
            {/* Conditionally show DELETE button */}
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button variant="destructive" onClick={DeletePaper}>
                Delete Selected
              </Button>
            )}
            <div className="text-muted-foreground hidden text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            {/* Page size selector */}
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

            {/* Page indicator */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>

            {/* Pagination buttons */}
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
  paper,
  fetchData,
}: {
  paper: ResearchPaper;
  fetchData: () => void;
}) {
  const updatePaperStatus = async (status: string) => {
    try {
      const response = await axios.put(`/api/paper/researchPaper`, {
        paperId: paper.id,
        status: status,
      });
      console.log(`Paper ${paper.id} status updated to ${status}`);
      toast.success(`Paper status updated to ${status}`);
    } catch (error) {
      console.error("Error updating paper status:", error);
      toast.error("Failed to update paper status. Please try again.");
    } finally {
      setOpen(false);
      fetchData();
    }
  };

  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              updatePaperStatus("PUBLISH");
            }}
          >
            <Ticket className="inline-block" />
            Accept Paper
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              updatePaperStatus("REJECT");
            }}
          >
            <Cross className="inline-block" />
            Reject Paper
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
