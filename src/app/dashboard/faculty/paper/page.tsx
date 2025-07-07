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
  Upload,
  X as Cross,
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
import { ResearchPaper } from "@prisma/client";

export default function ReviewerReqList() {
  const { data: session } = useSession();
  const [data, setData] = React.useState<ResearchPaper[]>([]);
  const [acceptedPapers, setAcceptedPapers] = React.useState<ResearchPaper[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = React.useState(1);

  // State for accepted papers table
  const [acceptedSorting, setAcceptedSorting] = React.useState<SortingState>([]);
  const [acceptedColumnFilters, setAcceptedColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [acceptedColumnVisibility, setAcceptedColumnVisibility] = React.useState<VisibilityState>({});
  const [acceptedRowSelection, setAcceptedRowSelection] = React.useState({});
  const [acceptedPagination, setAcceptedPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const papers = await axios.get("/api/paper/researchPaper", {
        params: { reviewer: session.user.id },
      });
      const allPapers: ResearchPaper[] = papers.data.data;
      setData(allPapers.filter((p) => p.reviewerStatus === "PENDING"));
      setAcceptedPapers(allPapers.filter((p) => p.reviewerStatus === "ACCEPTED"));
      setTotalPages(papers.data.pagination?.total || 1);
    } catch (err) {
      toast.error("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const reviewerAcceptence = async (
    paperId: string,
    reviewerStatus: string,
    status: string,
    fetchData: () => void
  ) => {
    try {
      const response = await axios.put(`/api/paper/researchPaper/${paperId}`, {
        reviewerStatus,
        status,
      });
      toast.success("Paper status updated successfully");
      fetchData(); // Only fetch data on success
    } catch (error) {
      console.error("Error updating paper status:", error);
      toast.error("Failed to update paper status");
    }
  };

  const updateData = React.useCallback(
    async (paperId: string, type: "ACCEPTED" | "REJECTED" | "ACCEPTED_FOR_PUBLISH"|"REJECTED_FOR_PUBLISH") => {
      setLoading(true);
      try {
        if (type === "ACCEPTED") {
          await reviewerAcceptence(paperId, "ACCEPTED", "ON_REVIEW", fetchData);
        } else if(type === "REJECTED") {
          await reviewerAcceptence(paperId, "REJECTED", "UPLOAD", fetchData);
        } else if(type === "ACCEPTED_FOR_PUBLISH") {
          await reviewerAcceptence(paperId, "ACCEPTED_FOR_PUBLISH", "PUBLISH", fetchData);
        } else if(type === "REJECTED_FOR_PUBLISH") {
          await reviewerAcceptence(paperId, "REJECTED_FOR_PUBLISH", "REJECT", fetchData);
        }
      } catch (error) {
        console.error("Error in updateData:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const columns: ColumnDef<ResearchPaper>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: () => <div className="text-left">Title</div>,
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        if (!title) return <div className="text-gray-500">No Title</div>;
        return <div className="lowercase">{title.length > 30 ? title.slice(0, 30) + "..." : title}</div>;
      },
    },
    {
      accessorKey: "keywords",
      header: () => <div className="text-left">Keywords</div>,
      cell: ({ row }) => {
        const keywords = row.getValue("keywords");
        return (
          <div className="lowercase">
            {Array.isArray(keywords) ? keywords.join(", ") : typeof keywords === "string" ? keywords : ""}
          </div>
        );
      },
    },
    {
      accessorKey: "filePath",
      header: () => <div className="text-left">Paper Link</div>,
      cell: ({ row }) => {
        const filePath = row.getValue("filePath") as string;
        return filePath ? (
          <a href={filePath} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            View Paper
          </a>
        ) : (
          <span className="text-gray-500">No File</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("status") || <span className="text-gray-500">No Status</span>}</div>
      ),
    },
    {
      accessorKey: "reviewerStatus",
      header: () => <div className="text-left">Reviewer Status</div>,
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("reviewerStatus") || <span className="text-gray-500">No Reviewer Status</span>}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const paperId = row.original.id;
        if (row.original.reviewerStatus === "PENDING") {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open actions menu">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateData(paperId, "ACCEPTED")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Accept Paper
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateData(paperId, "REJECTED")}>
                  <Cross className="h-4 w-4 mr-2" />
                  Reject Paper
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        return <span className="text-muted-foreground">No Actions</span>;
      },
    },
  ], [updateData]);

  const acceptedColumns: ColumnDef<ResearchPaper>[] = React.useMemo(() => [
    {
      accessorKey: "title",
      header: () => <div className="text-left">Title</div>,
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return <div className="lowercase">{title.length > 30 ? title.slice(0, 30) + "..." : title}</div>;
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("status") || <span className="text-gray-500">None</span>}</div>
      ),
    },
    {
      accessorKey: "reviewerStatus",
      header: () => <div className="text-left">Reviewer Status</div>,
      cell: ({ row }) => <div className="lowercase">{row.getValue("reviewerStatus")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const paperId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open actions menu">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => reviewerAcceptence(paperId, "ACCEPTED_FOR_PUBLISH", "PUBLISH", fetchData)}>
                <Upload className="h-4 w-4 mr-2" />
                Accept for Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => reviewerAcceptence(paperId, "REJECTED_FOR_PUBLISH", "REJECT", fetchData)}>
                <Cross className="h-4 w-4 mr-2" />
                Reject for Publish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [fetchData]);

  React.useEffect(() => {
    if (session?.user?.id) fetchData();
  }, [fetchData, session?.user?.id]);

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    manualPagination: true,
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
    data: acceptedPapers,
    columns: acceptedColumns,
    state: {
      sorting: acceptedSorting,
      columnFilters: acceptedColumnFilters,
      columnVisibility: acceptedColumnVisibility,
      rowSelection: acceptedRowSelection,
      pagination: acceptedPagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setAcceptedRowSelection,
    onSortingChange: setAcceptedSorting,
    onColumnFiltersChange: setAcceptedColumnFilters,
    onColumnVisibilityChange: setAcceptedColumnVisibility,
    onPaginationChange: setAcceptedPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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
    <p className="dark:text-white text-black text-xl font-bold text-center w-full sm:text-3xl my-4">
      List of Papers Assigned for Review
    </p>

    <Tabs defaultValue="pending" className="w-full flex-col gap-6">
      <TabsList className="mb-4">
        <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
        <TabsTrigger value="accepted">Accepted Papers</TabsTrigger>
      </TabsList>

      {/* Pending Reviews Tab */}
      <TabsContent
        value="pending"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {/* Column Customization for Pending */}
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
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
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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

      {/* Accepted Papers Tab */}
      <TabsContent
        value="accepted"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {/* Column Customization for Accepted */}
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
              {acceptedTable
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
                    <TableCell
                      colSpan={acceptedTable.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      No accepted papers.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination for Accepted Papers */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {acceptedTable.getFilteredSelectedRowModel().rows.length} of{" "}
            {acceptedTable.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="accepted-rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${acceptedTable.getState().pagination.pageSize}`}
                onValueChange={(value) => acceptedTable.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="accepted-rows-per-page">
                  <SelectValue placeholder={acceptedTable.getState().pagination.pageSize} />
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
              Page {acceptedTable.getState().pagination.pageIndex + 1} of {acceptedTable.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => acceptedTable.setPageIndex(0)}
                disabled={!acceptedTable.getCanPreviousPage()}
              >
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                onClick={() => acceptedTable.previousPage()}
                disabled={!acceptedTable.getCanPreviousPage()}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                onClick={() => acceptedTable.nextPage()}
                disabled={!acceptedTable.getCanNextPage()}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                onClick={() => acceptedTable.setPageIndex(acceptedTable.getPageCount() - 1)}
                disabled={!acceptedTable.getCanNextPage()}
              >
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

}
