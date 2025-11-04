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
  DollarSign,
  Activity,
  Star,
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
import { Transaction, PublicationStatus } from "@prisma/client";
import { AddTransactionDrawer } from "../_components/transactionAddForm";
import EditTransactionDialog from "../_components/transactionEditDialog";
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

interface TransactionFormData {
  transactionName: string;
  typeOfTransaction?: string;
  status: PublicationStatus;
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

interface ExtendedTransaction extends Transaction {
  teacher: {
    user: { id: string; fullName: string; email: string };
  };
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

export default function TransactionManagement() {
  const [data, setData] = useState<ExtendedTransaction[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState("");
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
    statusDate: DateRangeFilter;
    impactFactorDate: DateRangeFilter;
  }>({
    statusDate: {},
    impactFactorDate: {},
  });

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "statusDate", desc: true } // Default sort by status date (newest first)
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
    
    const totalTransactions = data.length;
    const publicTransactions = data.filter(item => item.isPublic).length;
    const privateTransactions = totalTransactions - publicTransactions;
    
    const publishedTransactions = data.filter(item => item.status === 'PUBLISHED').length;
    const acceptedTransactions = data.filter(item => item.status === 'ACCEPTED').length;
    const communicatedTransactions = data.filter(item => item.status === 'COMMUNICATED').length;
    
    const totalFees = data.reduce((sum, item) => sum + (item.registrationFees || 0), 0);
    const avgImpactFactor = data.filter(item => item.impactFactor).length > 0 
      ? data.reduce((sum, item) => sum + (item.impactFactor || 0), 0) / data.filter(item => item.impactFactor).length
      : 0;
    
    // Monthly data for current year
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      const transactionsThisMonth = data.filter(item => 
        item.statusDate && isWithinInterval(new Date(item.statusDate), { start: monthStart, end: monthEnd })
      ).length;
      
      const feesThisMonth = data
        .filter(item => item.statusDate && isWithinInterval(new Date(item.statusDate), { start: monthStart, end: monthEnd }))
        .reduce((sum, item) => sum + (item.registrationFees || 0), 0);
      
      return {
        month: format(new Date(currentYear, month), 'MMM'),
        transactions: transactionsThisMonth,
        fees: feesThisMonth,
      };
    });

    // Status distribution
    const statusData = [
      { name: 'Published', value: publishedTransactions, color: '#10B981' },
      { name: 'Accepted', value: acceptedTransactions, color: '#3B82F6' },
      { name: 'Communicated', value: communicatedTransactions, color: '#F59E0B' },
    ].filter(item => item.value > 0);

    // Recent transactions (last 6 months)
    const sixMonthsAgo = subMonths(currentDate, 6);
    const recentTransactions = data.filter(item => 
      item.statusDate && new Date(item.statusDate) >= sixMonthsAgo
    ).length;

    return {
      totalTransactions,
      publicTransactions,
      privateTransactions,
      publishedTransactions,
      acceptedTransactions,
      communicatedTransactions,
      totalFees,
      avgImpactFactor,
      monthlyData,
      statusData,
      recentTransactions,
      growthRate: totalTransactions > 0 ? (recentTransactions / totalTransactions) * 100 : 0,
    };
  }, [data]);

  // Table columns definition
  const columns: ColumnDef<ExtendedTransaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "transactionName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Transaction Name
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{row.getValue("transactionName")}</div>
          {row.original.typeOfTransaction && (
            <div className="text-xs text-gray-500 truncate">
              {row.original.typeOfTransaction}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Status
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as PublicationStatus;
        const statusColors = {
          PUBLISHED: "bg-green-100 text-green-800",
          ACCEPTED: "bg-blue-100 text-blue-800",
          COMMUNICATED: "bg-yellow-100 text-yellow-800",
        };
        return (
          <Badge className={`${statusColors[status]} text-xs`}>
            {status}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "statusDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Status Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("statusDate") as Date;
        return date ? format(new Date(date), "MMM dd, yyyy") : "-";
      },
    },
    {
      accessorKey: "impactFactor",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Impact Factor
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const impactFactor = row.getValue("impactFactor") as number;
        return impactFactor ? impactFactor.toFixed(3) : "-";
      },
    },
    {
      accessorKey: "registrationFees",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Registration Fees
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const fees = row.getValue("registrationFees") as number;
        return fees ? `₹${fees.toLocaleString()}` : "-";
      },
    },
    {
      accessorKey: "isPublic",
      header: "Visibility",
      cell: ({ row }) => {
        const isPublic = row.getValue("isPublic") as boolean;
        return (
          <Badge variant={isPublic ? "default" : "secondary"} className="text-xs">
            {isPublic ? (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Private
              </>
            )}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const transaction = row.original;

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
                onClick={() => {
                  setEditingTransactionId(transaction.id);
                  setIsEditDialogOpen(true);
                }}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeletingId(transaction.id);
                  setIsDeleteDialogOpen(true);
                }}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
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
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  });

  // Data fetching
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/teacher/transactions?teacherId=me");
      setData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Delete handlers
  const handleDelete = async (id: string) => {
    try {
      await axios.delete("/api/teacher/transactions", {
        data: { ids: [id] },
      });
      toast.success("Transaction deleted successfully");
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    try {
      await axios.delete("/api/teacher/transactions", {
        data: { ids: selectedIds },
      });
      toast.success(`${selectedIds.length} transaction(s) deleted successfully`);
      setRowSelection({});
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transactions:", error);
      toast.error("Failed to delete transactions");
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setStatusFilter("all");
    setDateFilters({
      statusDate: {},
      impactFactorDate: {},
    });
    table.resetColumnFilters();
  };

  const hasActiveFilters = 
    globalFilter !== "" || 
    columnFilters.length > 0 || 
    statusFilter !== "all" ||
    Object.values(dateFilters).some(filter => filter.from || filter.to);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/40 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            Transaction Management
          </h1>
          <p className="text-slate-600 font-medium">
            Manage your research transactions and publications with comprehensive analytics
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Analytics Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Transactions</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {analytics.totalTransactions}
                </div>
                <div className="flex items-center text-white/80">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">{analytics.publicTransactions} public</span>
                  </div>
                  <div className="w-1 h-1 bg-white/60 rounded-full mx-2"></div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">{analytics.privateTransactions} private</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Published</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                  {analytics.publishedTransactions}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-white to-green-200 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${analytics.totalTransactions > 0 ? ((analytics.publishedTransactions / analytics.totalTransactions) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {analytics.totalTransactions > 0 ? ((analytics.publishedTransactions / analytics.totalTransactions) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Fees</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  ₹{analytics.totalFees.toLocaleString()}
                </div>
                <div className="flex items-center text-white/80">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm font-medium">Registration and processing fees</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Avg Impact Factor</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {analytics.avgImpactFactor.toFixed(2)}
                </div>
                <div className="flex items-center text-white/80">
                  <Star className="h-4 w-4 mr-2 text-yellow-300" />
                  <span className="text-sm font-medium">Average across all transactions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Transactions Chart */}
            <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Monthly Transactions
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">Transaction submissions throughout the year</p>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="url(#purpleGradient)" />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Status Distribution
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">Current status of all transactions</p>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Management Controls */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transactions Data</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage and filter your transaction records
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTransactions}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  {Object.keys(rowSelection).length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({Object.keys(rowSelection).length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Filters Panel */}
            {showFilters && (
              <CardContent className="border-t">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Global Search */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                        <Input
                          placeholder="Search transactions..."
                          value={globalFilter}
                          onChange={(event) => setGlobalFilter(event.target.value)}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ACCEPTED">Accepted</SelectItem>
                          <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Date Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Status Date</Label>
                      <DateRangePicker
                        from={dateFilters.statusDate.from}
                        to={dateFilters.statusDate.to}
                        onSelect={(from, to) =>
                          setDateFilters(prev => ({
                            ...prev,
                            statusDate: { from, to }
                          }))
                        }
                        placeholder="Select date range"
                      />
                    </div>

                    {/* Impact Factor Date Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Impact Factor Date</Label>
                      <DateRangePicker
                        from={dateFilters.impactFactorDate.from}
                        to={dateFilters.impactFactorDate.to}
                        onSelect={(from, to) =>
                          setDateFilters(prev => ({
                            ...prev,
                            impactFactorDate: { from, to }
                          }))
                        }
                        placeholder="Select date range"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}

            <CardContent className={showFilters ? "pt-0" : ""}>
              {/* Table Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {table.getFilteredRowModel().rows.length} of{" "}
                    {table.getCoreRowModel().rows.length} transaction(s)
                  </div>
                  {Object.keys(rowSelection).length > 0 && (
                    <div className="text-sm text-blue-600">
                      {Object.keys(rowSelection).length} row(s) selected
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Data Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className="text-xs">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="text-xs"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-2">
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
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <AddTransactionDrawer
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchTransactions}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transactionId={editingTransactionId}
        onSuccess={fetchTransactions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingId) {
                  handleDelete(deletingId);
                  setIsDeleteDialogOpen(false);
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {Object.keys(rowSelection).length} selected transaction(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleBulkDelete();
                setIsBulkDeleteDialogOpen(false);
              }}
            >
              Delete {Object.keys(rowSelection).length} Transaction(s)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
