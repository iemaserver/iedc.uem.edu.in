"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "@tanstack/react-table";
import { format, startOfYear, endOfYear, isWithinInterval, subMonths } from "date-fns";
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
  CalendarDays,
  X,
  TrendingUp,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  Download,
  Eye,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { Copyright } from "@prisma/client";
import { AddCopyrightDrawer } from "../_components/copyrightAddForm";
import EditCopyrightDialog from "../_components/editDialog";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';

interface CopyrightFormData {
  title: string;
  inventors: string[];
  isPublic: boolean;
}

interface DateRangeFilter {
  from?: Date;
  to?: Date;
}
interface User {
  id: string;
  fullName: string;
  email: string;
}
interface ExtendedCopyright extends Copyright {
  inventors: {
    user: { id: string; fullName: string; email: string };
  }[];
}

// Date Range Picker Component
interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (from?: Date, to?: Date) => void;
  placeholder?: string;
  className?: string;
}

function DateRangePicker({
  from,
  to,
  onSelect,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayText =
    from || to
      ? `${from ? format(from, "MMM dd, yyyy") : "Start"} - ${to ? format(to, "MMM dd, yyyy") : "End"}`
      : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal h-8 text-xs ${
            !from && !to ? "text-gray-500" : ""
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
                  onSelect={(date) => onSelect(date, to)}
                  disabled={(date) => (to ? date > to : false)}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Calendar
                  mode="single"
                  selected={to}
                  required={true}
                  onSelect={(date) => onSelect(from, date)}
                  disabled={(date) => (from ? date < from : false)}
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
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function CopyrightManagement() {
  const [data, setData] = useState<ExtendedCopyright[]>([]);
  const [editingCopyrightId, setEditingCopyrightId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "filedAt", desc: true } // Default sort by filed date (newest first)
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Analytics calculations
  const analytics = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    
    const totalCopyrights = data.length;
    const publicCopyrights = data.filter(item => item.isPublic).length;
    const privateCopyrights = totalCopyrights - publicCopyrights;
    
    const grantedCopyrights = data.filter(item => item.grantedAt).length;
    const pendingCopyrights = totalCopyrights - grantedCopyrights;
    
    // Monthly data for current year
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      const filedThisMonth = data.filter(item => 
        item.filedAt && isWithinInterval(new Date(item.filedAt), { start: monthStart, end: monthEnd })
      ).length;
      
      const grantedThisMonth = data.filter(item => 
        item.grantedAt && isWithinInterval(new Date(item.grantedAt), { start: monthStart, end: monthEnd })
      ).length;
      
      return {
        month: format(monthStart, "MMM"),
        filed: filedThisMonth,
        granted: grantedThisMonth,
      };
    });
    
    // Recent activity (last 6 months)
    const sixMonthsAgo = subMonths(currentDate, 6);
    const recentCopyrights = data.filter(item => 
      item.filedAt && new Date(item.filedAt) >= sixMonthsAgo
    ).length;
    
    const growthRate = totalCopyrights > 0 ? ((recentCopyrights / totalCopyrights) * 100) : 0;
    
    return {
      totalCopyrights,
      publicCopyrights,
      privateCopyrights,
      grantedCopyrights,
      pendingCopyrights,
      monthlyData,
      growthRate: Math.round(growthRate),
      grantRate: totalCopyrights > 0 ? Math.round((grantedCopyrights / totalCopyrights) * 100) : 0,
    };
  }, [data]);

  // Chart data preparation
  const monthlyActivityData = analytics.monthlyData;
  
  const statusDistribution = [
    { 
      name: 'Granted', 
      value: analytics.grantedCopyrights, 
      color: '#10b981' 
    },
    { 
      name: 'Pending', 
      value: analytics.pendingCopyrights, 
      color: '#f59e0b' 
    },
    { 
      name: 'Public', 
      value: analytics.publicCopyrights, 
      color: '#3b82f6' 
    },
    { 
      name: 'Private', 
      value: analytics.privateCopyrights, 
      color: '#8b5cf6' 
    }
  ];

  // Form for add/edit
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CopyrightFormData>({
    defaultValues: {
      title: "",
      inventors: [],
      isPublic: false,
    },
  });

  // Custom filter function for date ranges
  const dateRangeFilter = (
    row: any,
    columnId: string,
    filterValue: DateRangeFilter
  ) => {
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
    const searchableColumns = ["title", "inventors"];
    if (!filterValue) return true;

    const searchValue = filterValue.toLowerCase();
    return searchableColumns.some((column) => {
      const cellValue = row.getValue(column);
      return (
        cellValue && cellValue.toString().toLowerCase().includes(searchValue)
      );
    });
  };

  // Apply date filters
  useEffect(() => {
    const filters: { id: string; value: DateRangeFilter }[] = [];
    Object.entries(dateFilters).forEach(([key, value]) => {
      if (value.from || value.to) {
        filters.push({
          id: key,
          value: value,
        });
      }
    });
    setColumnFilters(filters);
  }, [dateFilters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/teacher/copyrights?teacherId=me");
      setData(response.data.data); // since API returns {data, meta}
      toast.success("Data loaded successfully");
    } catch (error) {
      toast.error("Failed to load copyrights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enhanced table columns
  const columns = useMemo<ColumnDef<ExtendedCopyright>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="data-[state=checked]:bg-primary"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="data-[state=checked]:bg-primary"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold hover:bg-muted/50"
          >
            Title
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[280px] group">
            <div className="font-semibold text-sm leading-tight text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
              {row.original.title.length > 50
                ? `${row.original.title.slice(0, 50)}...`
                : row.original.title}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-slate-400" />
                <span className="font-mono">ID: {row.original.id.slice(0, 8)}...</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="text-slate-400">
                {new Date(row.original.filedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        ),
        enableSorting: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "inventors",
        header: "Inventors",
        cell: ({ row }) => (
          <div className="max-w-48 space-y-2">
            {row.original.inventors.slice(0, 2).map((inventor) => (
              <div 
                key={inventor.user.id} 
                className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    {inventor.user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-800 truncate">
                    {inventor.user.fullName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {inventor.user.email}
                  </div>
                </div>
              </div>
            ))}
            {row.original.inventors.length > 2 && (
              <div className="flex items-center justify-center p-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 text-slate-600">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <span>+{row.original.inventors.length - 2} more</span>
                </div>
              </div>
            )}
          </div>
        ),
        enableSorting: false,
        filterFn: "includesString",
      },
      {
        accessorKey: "filedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold hover:bg-muted/50"
          >
            Filed Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.filedAt ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-150 transition-all duration-300">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-blue-800">
                  {new Date(row.original.filedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                <div className="flex-shrink-0 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-sm">Not filed</span>
              </div>
            )}
          </div>
        ),
        filterFn: dateRangeFilter,
        enableSorting: true,
      },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold hover:bg-muted/50"
          >
            Submit Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.submittedAt ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200 hover:from-emerald-100 hover:to-green-150 transition-all duration-300">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-emerald-800">
                  {new Date(row.original.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                <div className="flex-shrink-0 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-sm">Not submitted</span>
              </div>
            )}
          </div>
        ),
        filterFn: dateRangeFilter,
        enableSorting: true,
      },
      {
        accessorKey: "publishedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold hover:bg-muted/50"
          >
            Publish Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.publishedAt ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-violet-100 border border-purple-200 hover:from-purple-100 hover:to-violet-150 transition-all duration-300">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-purple-800">
                  {new Date(row.original.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                <div className="flex-shrink-0 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-sm">Not published</span>
              </div>
            )}
          </div>
        ),
        filterFn: dateRangeFilter,
        enableSorting: true,
      },
      {
        accessorKey: "grantedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold hover:bg-muted/50"
          >
            Grant Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const grantedAt = row.original.grantedAt;
          return (
            <div className="text-sm">
              {grantedAt ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200 hover:from-emerald-100 hover:to-green-150 transition-all duration-300 group">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-semibold text-emerald-800">
                    {new Date(grantedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 hover:from-amber-100 hover:to-orange-150 transition-all duration-300 group">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-3 w-3 text-white animate-pulse" />
                  </div>
                  <span className="font-medium text-amber-800">Pending</span>
                </div>
              )}
            </div>
          );
        },
        filterFn: dateRangeFilter,
        enableSorting: true,
      },
      {
        accessorKey: "isPublic",
        header: "Visibility",
        cell: ({ getValue }) => {
          const isPublic = getValue() as boolean;
          return (
            <div className="flex items-center">
              {isPublic ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200 hover:from-emerald-100 hover:to-green-150 transition-all duration-300 group">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Globe className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium text-emerald-800">Public</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 group">
                  <div className="flex-shrink-0 w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium text-slate-700">Private</span>
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === "all") return true;
          const isPublic = row.getValue(columnId) as boolean;
          return filterValue === "public" ? isPublic : !isPublic;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const copyright = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full group transition-all duration-300 hover:scale-110"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors duration-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl">
                <DropdownMenuLabel className="flex items-center gap-2 text-slate-700 font-semibold">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(copyright.id)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>Copy ID</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditDialogOpen(true);
                    setEditingCopyrightId(copyright.id);
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 text-emerald-600" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(copyright.id)}
                  className="text-red-600 flex items-center gap-2 cursor-pointer hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
      },
    ],
    [dateRangeFilter]
  );

  // Filtered data based on status filter
  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    if (statusFilter === "public") return data.filter(item => item.isPublic);
    if (statusFilter === "private") return data.filter(item => !item.isPublic);
    if (statusFilter === "granted") return data.filter(item => item.grantedAt);
    if (statusFilter === "pending") return data.filter(item => !item.grantedAt);
    return data;
  }, [data, statusFilter]);

  // Enhanced table instance
  const table = useReactTable({
    data: filteredData,
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
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "filedAt", desc: true }],
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (Object.keys(rowSelection).length === 0) {
      toast.error("Please select rows to delete");
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };


  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await axios.delete(`/api/teacher/copyrights`, {
        data: { ids: [deletingId] },
      });

      if (response.status !== 200)
        throw new Error("Failed to delete copyright");

      setData((prev) => prev.filter((item) => item.id !== deletingId));
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Copyright deleted successfully");
    } catch (error) {
      toast.error("Failed to delete copyright");
    }
  };

  const handleConfirmBulkDelete = async () => {
    try {
      // Get selected row indices from TanStack Table's rowSelection state
      const selectedRowIds = Object.keys(rowSelection);
      // Map indices to actual copyright IDs
      const selectedIds = selectedRowIds
        .map((rowId) => {
          const row = table.getRow(rowId);
          return row?.original?.id;
        })
        .filter(Boolean);

      if (selectedIds.length === 0) {
        toast.error("No rows selected for deletion");
        return;
      }

      const response = await axios.delete("/api/teacher/copyrights", {
        data: { ids: selectedIds },
      });

      if (response.status !== 200)
        throw new Error("Failed to delete copyrights");

      setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setRowSelection({});
      setIsBulkDeleteDialogOpen(false);
      toast.success(`${selectedIds.length} copyrights deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete copyrights");
    }
  };

  const clearDateFilter = (dateType: keyof typeof dateFilters) => {
    setDateFilters((prev) => ({
      ...prev,
      [dateType]: {},
    }));
  };

  const setDateFilter = (
    dateType: keyof typeof dateFilters,
    from?: Date,
    to?: Date
  ) => {
    setDateFilters((prev) => ({
      ...prev,
      [dateType]: { from, to },
    }));
  };

  const hasActiveFilters = Object.values(dateFilters).some(
    (filter) => filter.from || filter.to
  );

  const clearAllFilters = () => {
    setDateFilters({
      filedAt: {},
      submittedAt: {},
      grantedAt: {},
      publishedAt: {},
    });
    setGlobalFilter("");
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Copyright Management
        </h1>
        <p className="text-muted-foreground">
          Manage and track your intellectual property copyrights
        </p>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Copyrights</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {analytics.totalCopyrights}
            </div>
            <div className="flex items-center text-white/80">
              <TrendingUp className="h-4 w-4 mr-2 group-hover:text-green-300 transition-colors duration-300" />
              <span className="text-sm font-medium">{analytics.growthRate}% growth (6mo)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Granted</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
              {analytics.grantedCopyrights}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-white to-green-200 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${analytics.grantRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white">{analytics.grantRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Pending</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {analytics.pendingCopyrights}
            </div>
            <div className="flex items-center text-white/80">
              <div className="w-2 h-2 bg-yellow-300 rounded-full mr-2 animate-pulse" />
              <span className="text-sm font-medium">Awaiting approval</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Public</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <Globe className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {analytics.publicCopyrights}
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm font-medium">{analytics.privateCopyrights} private</span>
              <Lock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity Chart */}
      <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Monthly Activity ({new Date().getFullYear()})
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="h-40 flex items-end justify-between space-x-3 p-4 bg-gradient-to-t from-slate-50/80 to-transparent rounded-xl">
            {analytics.monthlyData.map((month, index) => {
              const maxFiled = Math.max(...analytics.monthlyData.map(m => m.filed), 1);
              const maxGranted = Math.max(...analytics.monthlyData.map(m => m.granted), 1);
              const filedHeight = Math.max((month.filed / maxFiled) * 90, month.filed > 0 ? 12 : 4);
              const grantedHeight = Math.max((month.granted / maxGranted) * 90, month.granted > 0 ? 12 : 4);
              
              return (
                <div key={month.month} className="group flex flex-col items-center space-y-3 flex-1">
                  <div className="flex space-x-1.5 items-end h-24 relative">
                    {/* Filed bar */}
                    <div 
                      className={`rounded-t-lg min-w-[12px] shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl ${
                        month.filed > 0 
                          ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-blue-500' 
                          : 'bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 opacity-50'
                      }`}
                      style={{ height: `${filedHeight}px` }}
                      title={`Filed: ${month.filed}`}
                    />
                    {/* Granted bar */}
                    <div 
                      className={`rounded-t-lg min-w-[12px] shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl ${
                        month.granted > 0 
                          ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 group-hover:from-emerald-700 group-hover:via-emerald-600 group-hover:to-emerald-500' 
                          : 'bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 opacity-50'
                      }`}
                      style={{ height: `${grantedHeight}px` }}
                      title={`Granted: ${month.granted}`}
                    />
                    {/* Values display on hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                      Filed: {month.filed} | Granted: {month.granted}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-300">{month.month}</span>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 mx-auto mt-1 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend and summary */}
          <div className="space-y-4 mt-6">
            <div className="flex justify-center space-x-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors duration-300">Filed Applications</span>
              </div>
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors duration-300">Granted Copyrights</span>
              </div>
            </div>
            {/* Chart summary */}
            <div className="text-center p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-100">
              <p className="text-sm text-slate-600">
                Total this year: <span className="font-semibold text-blue-600">{analytics.monthlyData.reduce((sum, month) => sum + month.filed, 0)} filed</span>, 
                <span className="font-semibold text-emerald-600"> {analytics.monthlyData.reduce((sum, month) => sum + month.granted, 0)} granted</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 lg:w-400px bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-xl p-1">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
          >
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="management" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
          >
            <FileText className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.slice(0, 3).map((copyright) => (
                  <div key={copyright.id} className="flex items-center space-x-2 text-sm">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate flex-1">{copyright.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {copyright.grantedAt ? "Granted" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Public</span>
                    <span className="text-sm font-medium">{analytics.publicCopyrights}</span>
                  </div>
                  <Progress value={(analytics.publicCopyrights / analytics.totalCopyrights) * 100} className="h-2" />
                  <div className="flex justify-between">
                    <span className="text-sm">Private</span>
                    <span className="text-sm font-medium">{analytics.privateCopyrights}</span>
                  </div>
                  <Progress value={(analytics.privateCopyrights / analytics.totalCopyrights) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Grant Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.grantRate}%</div>
                  <p className="text-sm text-muted-foreground">
                    {analytics.grantedCopyrights} of {analytics.totalCopyrights} granted
                  </p>
                  <Progress value={analytics.grantRate} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Activity Chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyActivityData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorGranted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="filed"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorFiled)"
                      name="Filed"
                    />
                    <Area
                      type="monotone"
                      dataKey="granted"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorGranted)"
                      name="Granted"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="filed" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Filed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="granted" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Granted"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Copyright Records</CardTitle>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Copyright
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[80vh] overflow-auto">
              {/* Enhanced Toolbar */}
              <div className="flex flex-col space-y-4">
                {/* Search and Filters Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-1 items-center space-x-2 max-w-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search copyrights..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-9 h-10 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    {globalFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGlobalFilter("")}
                        className="h-10 px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 h-10">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="granted">Granted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Page Size Selector */}
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="w-20 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadData}
                      disabled={loading}
                      className="h-10"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={showFilters ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-9"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Date Filters
                      {hasActiveFilters && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </Button>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-9 text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                          Columns
                          <ChevronDown className="ml-2 h-4 w-4" />
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
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center space-x-2">
                    {Object.keys(rowSelection).length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="h-9 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({Object.keys(rowSelection).length})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Date Range Filters */}
              {showFilters && (
                <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-2xl animate-in slide-in-from-top duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl" />
                  
                  <div className="relative z-10 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                          <Filter className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">Advanced Filters</h3>
                          <p className="text-sm text-slate-600">Filter by date ranges for precise results</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-white/50 transition-all duration-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Filed Date Filter */}
                      <div className="space-y-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            Filed Date
                          </Label>
                          {(dateFilters.filedAt.from || dateFilters.filedAt.to) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearDateFilter("filedAt")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <DateRangePicker
                          from={dateFilters.filedAt.from}
                          to={dateFilters.filedAt.to}
                          onSelect={(from, to) => setDateFilter("filedAt", from, to)}
                          placeholder="Select filed date range"
                        />
                      </div>

                      {/* Submit Date Filter */}
                      <div className="space-y-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            Submit Date
                          </Label>
                          {(dateFilters.submittedAt.from ||
                            dateFilters.submittedAt.to) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearDateFilter("submittedAt")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <DateRangePicker
                          from={dateFilters.submittedAt.from}
                          to={dateFilters.submittedAt.to}
                          onSelect={(from, to) =>
                            setDateFilter("submittedAt", from, to)
                          }
                          placeholder="Select submit date range"
                        />
                      </div>

                      {/* Grant Date Filter */}
                      <div className="space-y-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            Grant Date
                          </Label>
                          {(dateFilters.grantedAt.from ||
                            dateFilters.grantedAt.to) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearDateFilter("grantedAt")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <DateRangePicker
                          from={dateFilters.grantedAt.from}
                          to={dateFilters.grantedAt.to}
                          onSelect={(from, to) =>
                            setDateFilter("grantedAt", from, to)
                          }
                          placeholder="Select grant date range"
                        />
                      </div>

                      {/* Publish Date Filter */}
                      <div className="space-y-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            Publish Date
                          </Label>
                          {(dateFilters.publishedAt.from ||
                            dateFilters.publishedAt.to) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearDateFilter("publishedAt")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <DateRangePicker
                          from={dateFilters.publishedAt.from}
                          to={dateFilters.publishedAt.to}
                          onSelect={(from, to) =>
                            setDateFilter("publishedAt", from, to)
                          }
                          placeholder="Select publish date range"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Table */}
              <div className="rounded-xl border border-slate-200/60 shadow-xl bg-white/90 backdrop-blur-md overflow-hidden">
                {/* Mobile Card View */}
                <div className="lg:hidden">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="text-lg font-bold text-slate-700">Loading...</span>
                      </div>
                    </div>
                  ) : table.getRowModel().rows.length ? (
                    <div className="divide-y divide-slate-200">
                      {table.getRowModel().rows.map((row, index) => (
                        <div key={row.id} className="p-4 hover:bg-slate-50 transition-colors duration-200">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                                  {row.original.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                  ID: {row.original.id.slice(0, 12)}...
                                </p>
                              </div>
                              <div className="ml-2">
                                {row.original.grantedAt ? (
                                  <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    <CheckCircle className="h-3 w-3" />
                                    Granted
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              {row.original.isPublic ? (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3 text-emerald-500" />
                                  <span>Public</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Lock className="h-3 w-3 text-slate-500" />
                                  <span>Private</span>
                                </div>
                              )}
                              <span>•</span>
                              <span>{row.original.inventors.length} inventor{row.original.inventors.length !== 1 ? 's' : ''}</span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-slate-500">
                                Filed: {row.original.filedAt ? new Date(row.original.filedAt).toLocaleDateString() : 'Not filed'}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setIsEditDialogOpen(true);
                                    setEditingCopyrightId(row.original.id);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(row.original.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <div className="text-lg font-bold text-slate-700 mb-2">No copyrights found</div>
                      <p className="text-slate-500 text-sm">
                        {globalFilter || statusFilter !== "all" 
                          ? "Try adjusting your filters" 
                          : "Add your first copyright"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 hover:from-slate-100 hover:to-slate-100 transition-all duration-300">
                          {headerGroup.headers.map((header) => (
                            <TableHead 
                              key={header.id} 
                              className="font-bold text-slate-700 py-4 px-6 first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                              style={{ width: header.getSize() }}
                            >
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
                          <TableCell
                            colSpan={columns.length}
                            className="h-40 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50"
                          >
                            <div className="flex items-center justify-center space-x-3 py-8">
                              <div className="relative">
                                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                <div className="absolute inset-0 h-8 w-8 animate-ping bg-blue-400/30 rounded-full" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-lg font-bold text-slate-700">Loading copyrights...</span>
                                <div className="text-sm text-slate-500">Please wait while we fetch your data</div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, index) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={`group relative transition-all duration-300 ${
                              index % 2 === 0 
                                ? 'bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50' 
                                : 'bg-slate-50/30 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70'
                            } hover:shadow-md hover:scale-[1.01] border-b border-slate-100 border-l-0 hover:border-l-4 hover:border-l-blue-500`}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="py-4 px-6 group-hover:text-slate-800 transition-colors duration-300">
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
                            className="h-40 text-center bg-gradient-to-br from-slate-50 to-slate-100"
                          >
                            <div className="flex flex-col items-center space-y-4 py-8">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl" />
                                <FileText className="relative h-16 w-16 text-slate-400" />
                              </div>
                              <div className="space-y-2">
                                <div className="text-xl font-bold text-slate-700">No copyrights found</div>
                                <p className="text-slate-500 max-w-md">
                                  {globalFilter || statusFilter !== "all" 
                                    ? "Try adjusting your search or filters to find what you're looking for" 
                                    : "Get started by adding your first copyright application"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
                           

              {/* Enhanced Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-6 px-2">
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  {Object.keys(rowSelection).length > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-blue-700">
                        {Object.keys(rowSelection).length} selected
                      </span>
                    </div>
                  )}
                  <span className="font-medium">
                    Showing {table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
                  </span>
                  {data.length !== filteredData.length && (
                    <span className="text-slate-500">
                      (filtered from {data.length} total)
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <span>Page</span>
                    <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg border">
                      <span className="font-bold text-slate-800">
                        {table.getState().pagination.pageIndex + 1}
                      </span>
                      <span className="text-slate-500">of</span>
                      <span className="font-bold text-slate-800">
                        {table.getPageCount()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className="h-9 px-3 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40"
                    >
                      <span className="font-bold">{"<<"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                      className="h-9 px-3 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40"
                    >
                      <span className="font-bold">{">>"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddCopyrightDrawer
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        setData={setData}
      />
      
      <EditCopyrightDialog
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        copyrightId={editingCopyrightId}
        onUpdate={(updatedCopyright: any) => {
          setData((prevData) =>
            prevData.map((copyright) =>
              copyright.id === updatedCopyright.id ? updatedCopyright : copyright
            )
          );
          setIsEditDialogOpen(false);
          setEditingCopyrightId("");
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              copyright and remove the data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Copyrights</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {Object.keys(rowSelection).length}{" "}
              selected copyrights? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
            >
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
