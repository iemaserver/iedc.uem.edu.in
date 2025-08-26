"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  RowSelectionState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import axios from 'axios';
import { Copyright, Patent } from '@prisma/client';


interface CopyrightFormData {
  title: string;
  inventors: string;
  isPublic: boolean;
}

interface DateRangeFilter {
  from?: Date;
  to?: Date;
}



// Date Range Picker Component
interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (from?: Date, to?: Date) => void;
  placeholder?: string;
  className?: string;
}

function DateRangePicker({ from, to, onSelect, placeholder = "Pick a date range", className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayText = from || to 
    ? `${from ? format(from, 'MMM dd, yyyy') : 'Start'} - ${to ? format(to, 'MMM dd, yyyy') : 'End'}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal h-8 text-xs ${
            !from && !to ? 'text-gray-500' : ''
          } ${className}`}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Select Date Range</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From</Label>
                <Calendar
                  mode="single"
                  required={true}
                  selected={from}
                  onSelect={(date: Date) => onSelect(date, to)}
                  disabled={(date: Date) => to ? date > to : false}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Calendar
                  mode="single"
                  selected={to}
                  required={true}
                  onSelect={(date: Date) => onSelect(from, date)}
                  disabled={(date: Date) => from ? date < from : false}
                  className="rounded-md border"
                />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelect(undefined, undefined);
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Date Picker Component for Forms
interface DatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

function DatePicker({ date, onSelect, placeholder = "Pick a date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${
            !date ? 'text-gray-500' : ''
          } ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
         required 
captionLayout="dropdown"
          onSelect={(selectedDate: Date) => {
            onSelect(selectedDate);
            setIsOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function CopyrightManagement() {
  const [data, setData] = useState<Copyright[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [editingCopyright, setEditingCopyright] = useState<Copyright | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilters, setDateFilters] = useState<{
    filedAt: DateRangeFilter;
    submittedAt: DateRangeFilter;
    grantedAt: DateRangeFilter;
    publishedAt: DateRangeFilter;
  }>({
    filedAt: {},
    submittedAt: {},
    grantedAt: {},
    publishedAt: {},
  });
  
  // Form date states
  const [formDates, setFormDates] = useState({
    filedAt: undefined as Date | undefined,
    submittedAt: undefined as Date | undefined,
    grantedAt: undefined as Date | undefined,
    publishedAt: undefined as Date | undefined,
  });
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Form for add/edit
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CopyrightFormData>({
    defaultValues: {
      title: '',
      inventors: '',
      isPublic: false,
    },
  });

  // Custom filter function for date ranges
  const dateRangeFilter = (row: any, columnId: string, filterValue: DateRangeFilter) => {
    if (!filterValue.from && !filterValue.to) return true;
    
    const cellValue = row.getValue(columnId);
    if (!cellValue) return false;
    
    const cellDate = new Date(cellValue);
    
    if (filterValue.from && filterValue.to) {
      return cellDate >= filterValue.from && cellDate <= filterValue.to;
    } else if (filterValue.from) {
      return cellDate >= filterValue.from;
    } else if (filterValue.to) {
      return cellDate <= filterValue.to;
    }
    
    return true;
  };

  // Custom global filter that only searches title, inventors
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const searchableColumns = ['title', 'inventors'];
    if (!filterValue) return true;
    
    const searchValue = filterValue.toLowerCase();
    return searchableColumns.some(column => {
      const cellValue = row.getValue(column);
      return cellValue && cellValue.toString().toLowerCase().includes(searchValue);
    });
  };

  // Apply date filters
  useEffect(() => {
    const filters: { id: string; value: DateRangeFilter }[] = [];
    Object.entries(dateFilters).forEach(([key, value]) => {
      if (value.from || value.to) {
        filters.push({
          id: key,
          value: value
        });
      }
    });
    setColumnFilters(filters);
  }, [dateFilters]);

  // Your original loadData function
  const loadData = async () => {
    setLoading(true);
    try {
      // Using your original axios call
      const response = await fetch('/api/teacher/patent');
      const result = await response.json();
      const patent = result.data;
      setData(patent);
      toast.success('Data loaded successfully');
    } catch (error) {
      toast.error('Failed to load patent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<Patent>[]>(() => [
    {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="text-xs">
        {row.original.title.length > 20
          ? `${row.original.title.slice(0, 20)}...`
          : row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "inventors",
    header: "Inventors",
    cell: ({ row }) => <div className="text-xs">{row.original.inventors}</div>,
  },
  {
    accessorKey: "applicant",
    header: "Applicant",
    cell: ({ row }) => <div className="text-xs">{row.original.applicant}</div>,
  },
  {
    accessorKey: "applicationNo",
    header: "Application No",
    cell: ({ row }) => <div className="text-xs">{row.original.applicationNo || "N/A"}</div>,
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => <div className="text-xs">{row.original.country || "N/A"}</div>,
  },
  {
    accessorKey: "filedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Filed At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const filedAt = row.original.filedAt
        ? new Date(row.original.filedAt).toLocaleDateString()
        : "N/A";
      return <div className="text-right">{filedAt}</div>;
    },
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Submitted At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const submittedAt = row.original.submittedAt
        ? new Date(row.original.submittedAt).toLocaleDateString()
        : "N/A";
      return <div className="text-right">{submittedAt}</div>;
    },
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Published At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const publishedAt = row.original.publishedAt
        ? new Date(row.original.publishedAt).toLocaleDateString()
        : "N/A";
      return <div className="text-right">{publishedAt}</div>;
    },
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: "grantedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Granted At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const grantedAt = row.original.grantedAt
        ? new Date(row.original.grantedAt).toLocaleDateString()
        : "N/A";
      return <div className="text-right">{grantedAt}</div>;
    },
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: "isPublic",
    header: () => <div className="text-right">Accessibility</div>,
    cell: ({ row }) =>
      row.original.isPublic ? (
        <Badge variant="outline" className="text-right">
          Public
        </Badge>
      ) : (
        <Badge variant="destructive" className="text-right">
          Private
        </Badge>
      ),
    filterFn: "equals",
  },
  ], []);


  // Table instance
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
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  });

  // Handlers
  const handleAdd = () => {
    reset({
      title: '',
      inventors: '',
      isPublic: false,
    });
    setFormDates({
      filedAt: undefined,
      submittedAt: undefined,
      grantedAt: undefined,
      publishedAt: undefined,
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (copyright: Copyright) => {
    setEditingCopyright(copyright);
    setValue('title', copyright.title);
    setValue('inventors', copyright.inventors);
    setValue('isPublic', copyright.isPublic);
    
    setFormDates({
      filedAt: copyright.filedAt ? new Date(copyright.filedAt) : undefined,
      submittedAt: copyright.submittedAt ? new Date(copyright.submittedAt) : undefined,
      grantedAt: copyright.grantedAt ? new Date(copyright.grantedAt) : undefined,
      publishedAt: copyright.publishedAt ? new Date(copyright.publishedAt) : undefined,
    });
    
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (Object.keys(rowSelection).length === 0) {
      toast.error('Please select rows to delete');
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const onSubmitAdd = async (formData: CopyrightFormData) => {
    try {
      const payload = {
        ...formData,
        filedAt: formDates.filedAt || null,
        submittedAt: formDates.submittedAt || null,
        grantedAt: formDates.grantedAt || null,
        publishedAt: formDates.publishedAt || null,
      };

      const response = await axios.post('/api/teacher/patent', payload);

      if (response.status !== 201) throw new Error('Failed to create copyright');

      const result = response.data;
      setData(prev => [...prev, result.data]);
      setIsAddDialogOpen(false);
      reset();
      setFormDates({
        filedAt: undefined,
        submittedAt: undefined,
        grantedAt: undefined,
        publishedAt: undefined,
      });
      toast.success('Copyright added successfully');
    } catch (error) {
      toast.error('Failed to add copyright');
    }
  };

  const onSubmitEdit = async (formData: CopyrightFormData) => {
    if (!editingCopyright) return;
    
    try {
      const payload = {

        ...formData,
        id: editingCopyright.id,
        filedAt: formDates.filedAt || null,
        submittedAt: formDates.submittedAt || null,
        grantedAt: formDates.grantedAt || null,
        publishedAt: formDates.publishedAt || null,
      };

      const response = await axios.put(`/api/teacher/patent`, payload);

      if (response.status !== 200) throw new Error('Failed to update copyright');

      const result = response.data;
      setData(prev => prev.map(item => 
        item.id === editingCopyright.id ? result.data : item
      ));
      setIsEditDialogOpen(false);
      setEditingCopyright(null);
      reset();
      setFormDates({
        filedAt: undefined,
        submittedAt: undefined,
        grantedAt: undefined,
        publishedAt: undefined,
      });
      toast.success('Copyright updated successfully');
    } catch (error) {
      toast.error('Failed to update copyright');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      const response = await axios.delete(`/api/teacher/patent`, {
        data: { ids: [deletingId] }
      });

      if (response.status !== 200) throw new Error('Failed to delete copyright');

      setData(prev => prev.filter(item => item.id !== deletingId));
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success('Copyright deleted successfully');
    } catch (error) {
      toast.error('Failed to delete copyright');
    }
  };

  const handleConfirmBulkDelete = async () => {
  
    try {
      // Get selected row indices from TanStack Table's rowSelection state
      const selectedRowIds = Object.keys(rowSelection);
      // Map indices to actual copyright IDs
      const selectedIds = selectedRowIds.map(rowId => {
      const row = table.getRow(rowId);
      return row?.original?.id;
      }).filter(Boolean);

      if (selectedIds.length === 0) {
      toast.error('No rows selected for deletion');
      return;
      }

      const response = await axios.delete('/api/teacher/patent', {
      data: { ids: selectedIds }
      });

      if (response.status !== 200) throw new Error('Failed to delete patent');

      setData(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setRowSelection({});
      setIsBulkDeleteDialogOpen(false);
      toast.success(`${selectedIds.length} patent deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete patent');
    }
  };

  const clearDateFilter = (dateType: keyof typeof dateFilters) => {
    setDateFilters(prev => ({
      ...prev,
      [dateType]: {}
    }));
  };

  const setDateFilter = (dateType: keyof typeof dateFilters, from?: Date, to?: Date) => {
    setDateFilters(prev => ({
      ...prev,
      [dateType]: { from, to }
    }));
  };

  const hasActiveFilters = Object.values(dateFilters).some(filter => filter.from || filter.to);

  const clearAllFilters = () => {
    setDateFilters({
      filedAt: {},
      submittedAt: {},
      grantedAt: {},
      publishedAt: {},
    });
    setGlobalFilter('');
  };

  return (
    <div className="space-y-6 p-6 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Copyright Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search title, inventors..."
                  value={globalFilter ?? ''}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8"
                />
              </div>
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter('')}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="h-4 w-4" />
                Date Filters
                {hasActiveFilters && <div className="ml-1 h-2 w-2 rounded-full bg-blue-500" />}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Columns
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}

              <Button onClick={handleAdd} size="sm" className="h-8">
                <Plus className="h-4 w-4" />
                Add Copyright
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Date Range Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filed Date Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Filed Date</Label>
                    {(dateFilters.filedAt.from || dateFilters.filedAt.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearDateFilter('filedAt')}
                        className="h-4 w-4 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <DateRangePicker
                    from={dateFilters.filedAt.from}
                    to={dateFilters.filedAt.to}
                    onSelect={(from, to) => setDateFilter('filedAt', from, to)}
                    placeholder="Select filed date range"
                  />
                </div>

                {/* Submit Date Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Submit Date</Label>
                    {(dateFilters.submittedAt.from || dateFilters.submittedAt.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearDateFilter('submittedAt')}
                        className="h-4 w-4 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <DateRangePicker
                    from={dateFilters.submittedAt.from}
                    to={dateFilters.submittedAt.to}
                    onSelect={(from, to) => setDateFilter('submittedAt', from, to)}
                    placeholder="Select submit date range"
                  />
                </div>

                {/* Grant Date Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Grant Date</Label>
                    {(dateFilters.grantedAt.from || dateFilters.grantedAt.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearDateFilter('grantedAt')}
                        className="h-4 w-4 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <DateRangePicker
                    from={dateFilters.grantedAt.from}
                    to={dateFilters.grantedAt.to}
                    onSelect={(from, to) => setDateFilter('grantedAt', from, to)}
                    placeholder="Select grant date range"
                  />
                </div>

                {/* Publish Date Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Publish Date</Label>
                    {(dateFilters.publishedAt.from || dateFilters.publishedAt.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearDateFilter('publishedAt')}
                        className="h-4 w-4 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <DateRangePicker
                    from={dateFilters.publishedAt.from}
                    to={dateFilters.publishedAt.to}
                    onSelect={(from, to) => setDateFilter('publishedAt', from, to)}
                    placeholder="Select publish date range"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Table */}
          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-gray-500">
              {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </p>
              <div className="flex items-center space-x-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Copyright</DialogTitle>
            <DialogDescription>
              Create a new copyright entry with all required information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter copyright title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title?.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="inventors">Inventors</Label>
                <Input
                  id="inventors"
                  {...register('inventors', { required: 'Inventors are required' })}
                  placeholder="Enter inventor names"
                />
                {errors.inventors && (
                  <p className="text-sm text-red-600 mt-1">{errors.inventors?.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="filedAt">Filed Date</Label>
                <Input
                  type='date'
                  value={formDates.filedAt ? formDates.filedAt.toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormDates(prev => ({
                      ...prev,
                      filedAt: value ? new Date(value) : undefined
                    }));
                  }}
                  placeholder="Select filed date" 
                />
              </div>

              <div>
                <Label htmlFor="submittedAt">Submit Date</Label>
                <Input
                  id="submittedAt"
                  type='date'
                  value={formDates.submittedAt ? formDates.submittedAt.toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormDates(prev => ({
                      ...prev,
                      submittedAt: value ? new Date(value) : undefined
                    }));
                  }}
                  placeholder="Select submit date"
                />
              </div>

              <div>
                <Label htmlFor="grantedAt">Grant Date</Label>
                <Input
                  id="grantedAt"
                  type='date'
                  value={formDates.grantedAt ? formDates.grantedAt.toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormDates(prev => ({
                      ...prev,
                      grantedAt: value ? new Date(value) : undefined
                    }));
                  }}
                  placeholder="Select grant date"
                />
              </div>

              <div>
                <Label htmlFor="publishedAt">Publish Date</Label>
                <Input
                  id="publishedAt"
                  type='date'
                  value={formDates.publishedAt ? formDates.publishedAt.toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormDates(prev => ({
                      ...prev,
                      publishedAt: value ? new Date(value) : undefined
                    }));
                  }}
                  placeholder="Select publish date"
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Make Public</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Copyright'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Copyright</DialogTitle>
            <DialogDescription>
              Update the copyright information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter copyright title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title?.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="edit-inventors">Inventors</Label>
                <Input
                  id="edit-inventors"
                  {...register('inventors', { required: 'Inventors are required' })}
                  placeholder="Enter inventor names"
                />
                <DatePicker
                  date={formDates.grantedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, grantedAt: date }))}
                  placeholder="Select grant date"
                />
              </div>

              <div>
                <Label htmlFor="publishedAt">Publish Date</Label>
                <DatePicker
                  date={formDates.publishedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, publishedAt: date }))}
                  placeholder="Select publish date"
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Make Public</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Copyright'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Copyright</DialogTitle>
            <DialogDescription>
              Update the copyright information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter copyright title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title?.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-inventors">Inventors</Label>
                <Input
                  id="edit-inventors"
                  {...register('inventors', { required: 'Inventors are required' })}
                  placeholder="Enter inventor names"
                />
                {errors.inventors && (
                  <p className="text-sm text-red-600 mt-1">{errors.inventors?.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-filedAt">Filed Date</Label>
                <DatePicker
                  date={formDates.filedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, filedAt: date }))}
                  placeholder="Select filed date"
                />
              </div>

              <div>
                <Label htmlFor="edit-submittedAt">Submit Date</Label>
                <DatePicker
                  date={formDates.submittedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, submittedAt: date }))}
                  placeholder="Select submit date"
                />
              </div>

              <div>
                <Label htmlFor="edit-grantedAt">Grant Date</Label>
                <DatePicker
                  date={formDates.grantedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, grantedAt: date }))}
                  placeholder="Select grant date"
                />
              </div>

              <div>
                <Label htmlFor="edit-publishedAt">Publish Date</Label>
                <DatePicker
                  date={formDates.publishedAt}
                  onSelect={(date) => setFormDates(prev => ({ ...prev, publishedAt: date }))}
                  placeholder="Select publish date"
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="edit-isPublic"
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
                <Label htmlFor="edit-isPublic">Make Public</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Copyright'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the copyright
              and remove the data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple patent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {Object.keys(rowSelection).length} selected patent? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmBulkDelete}>
              Delete Selected
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}