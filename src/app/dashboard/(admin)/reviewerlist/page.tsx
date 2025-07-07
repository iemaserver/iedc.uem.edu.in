"use client";
import * as React from "react";
  
import  { useState } from 'react';

import { z } from 'zod';

import { ArrowDownWideNarrow, Circle, CircleDashed } from 'lucide-react';


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
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender, // Added for rendering headers/cells
} from "@tanstack/react-table";
import { ArrowUpDown, Copy, MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Button } from "@/components/ui/button";
import { UserDetails } from "@prisma/client";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"; // Imported missing icons
import { Input } from "@/components/ui/input";
// Zod schema
const userTypeSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  name: z.string().min(1, { message: 'Name is required' }),
  userType: z.enum(['FACULTY', 'ADMIN'], {
    errorMap: () => ({ message: 'User type must be REVIEWER or ADMIN' }),
  }),
});
function FacultyList() {
  const { data: session } = useSession();
  //console.log("Session from FacultyList:", session);
  const [data, setData] = React.useState<UserDetails[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Define state variables for react-table
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(0); // This will need to be correctly set based on API response if using manual pagination

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/user/admin/userType` // Adjust the endpoint as needed
      );
      setData(res.data.users || res.data); 
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]); // Dependencies for useCallback

  // Delete data function
  const deleteData = React.useCallback(
    async (email: string) => {
      setLoading(true);
      try {
        await axios.delete("/api/user/admin/userType", {
          data: { email },
        
        });
        toast.success("Deleted successfully!");
      } catch (error) {
        console.error("Failed to delete data:", error);
        toast.error("Failed to delete data.");
      } finally {
        fetchData(); // Refresh data after deletion
        setLoading(false);
      }
    },
    [fetchData]
  );

  // Update data function
  const updateData = React.useCallback(
    async (email: string, userType: string, name: string) => {
      setLoading(true);
      try {
        await axios.patch(
          "/api/user/admin/userType",
          { email, userType, name },
          { headers: { "Content-Type": "application/json" } }
        );
        toast.success("Updated successfully!");
      } catch (error) {
        console.error("Failed to update data:", error);
        toast.error("Failed to update data.");
      } finally {
        fetchData(); // Refresh data after update
        setLoading(false);
      }
    },
    [fetchData]
  );

  // Define columns for UserDetails
  const columns: ColumnDef<UserDetails>[] = React.useMemo(
    () => [
      // Add a select column for bulk actions if needed
      // {
      //   id: "select",
      //   header: ({ table }) => (
      //     <Checkbox
      //       checked={table.getIsAllPageRowsSelected()}
      //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      //       aria-label="Select all"
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <Checkbox
      //       checked={row.getIsSelected()}
      //       onCheckedChange={(value) => row.toggleSelected(!!value)}
      //       aria-label="Select row"
      //     />
      //   ),
      //   enableSorting: false,
      //   enableHiding: false,
      // },
      {
        accessorKey: "id",
        header: () => <div className="text-left">ID</div>,
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "userType",
        header: () => <div className="text-right">User Type</div>, // Corrected casing
        cell: ({ row }) => {
          return (
            <div className="text-right font-medium uppercase">
              {row.getValue("userType")}
            </div>
          );
        },
      },
      // Add an actions column for delete/edit if needed
     {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
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

        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(user.email)}
          className="text-muted-foreground cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4 text-blue-500" />
          Copy email
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => deleteData(user.email)}
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
          Delete User
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => updateData(user.email, "ADMIN", user.name)}
          className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900 cursor-pointer"
        >
          <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
          Make Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateData(user.email, "FACULTY", user.name)}
          className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900 cursor-pointer"
        >
          <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
          Make Reviewer
        </DropdownMenuItem>

       
      </DropdownMenuContent>
    </DropdownMenu>
          );
         },
      },
    ],
    [deleteData, updateData] // Add deleteData and updateData to dependencies
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]); // Initial data fetch

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    manualPagination: true, // Set to true since you're handling pagination manually
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

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('');

  const handleSubmit = async () => {
    const result = userTypeSchema.safeParse({ email, userType,name });

    if (!result.success) {
      result.error.errors.forEach(err => toast.error(err.message));
      return;
    }

    try {
      const res = await axios.post('/api/user/admin/userType', {
        email,
        userType,
        name: name.toLowerCase().trim(),
      });
      toast.success('User added successfully!');
      setEmail('');
      setUserType('');
      setName('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error adding user');
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 justify-around items-center overflow-hidden md:px-10 px-2 ">
      <p className="dark:text-white text-black text-xl font-bold border-b border-black dark:border-white py-3 text-center w-full sm:text-2xl">
        Add Special User Type and their email
      </p>
    <div className='w-full h-auto flex flex-row flex-wrap gap-4 justify-center items-center px-5'>
      <Input
        type='text'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='Enter email'
        className='w-[40%] min-w-[22rem] h-10'
      />
      <Input
        type='text'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Enter Name'
        className='w-[40%] min-w-[22rem] h-10'
      />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='md:w-[10%] h-10 min-w-[22rem] md:min-w-[16rem] justify-between'
          >
            {userType || 'Select User Type'}
            {userType?'':<ArrowDownWideNarrow/>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-full '>
          <DropdownMenuItem onClick={() => setUserType('FACULTY')}>
            FACULTY
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUserType('ADMIN')}>
            ADMIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant='default' className='w-16 h-10 px-5 py-2' onClick={handleSubmit}>
        Add
      </Button>
    </div>
  
      <p className="dark:text-white text-black text-xl font-bold py-3 text-center w-full sm:text-2xl">
        List of Reviewer and Admin
      </p>
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
              {table.getAllColumns()
                .filter((col) => col.getCanHide() && typeof col.accessorFn !== "undefined")
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
          <Button
            variant="outline"
            onClick={() => fetchData()}
          >
            Reload <CircleDashed className="animate-spin" />
          </Button>
          <Input
            placeholder="Search..."
            className="ml-4"
            onChange={(e)=>{
              const value = e.target.value;
              table.setGlobalFilter(value);
            }}
          />
        </div>

        <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

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
      </Tabs>
    </div>
  );
}

export default FacultyList;