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
  Users,
  MapPin,
  Monitor,
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
import { Conference, PublicationStatus } from "@prisma/client";
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
import { EditConferenceDialog } from "../_components/conferenceEditDialog";
import { AddConferenceDrawer } from "../_components/conferenceAddForm";

interface ConferenceFormData {
  conferenceName: string;
  mode?: string;
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

interface ExtendedConference extends Conference {
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

export default function ConferenceManagement() {
  const [data, setData] = useState<ExtendedConference[]>([]);
  const [editingConference, setEditingConference] = useState<ExtendedConference | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [dateFilters, setDateFilters] = useState<{
    statusDate: DateRangeFilter;
  }>({
    statusDate: {},
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
    
    const totalConferences = data.length;
    const publicConferences = data.filter(item => item.isPublic).length;
    const privateConferences = totalConferences - publicConferences;
    
    const publishedConferences = data.filter(item => item.status === 'PUBLISHED').length;
    const acceptedConferences = data.filter(item => item.status === 'ACCEPTED').length;
    const communicatedConferences = data.filter(item => item.status === 'COMMUNICATED').length;
    
    const onlineConferences = data.filter(item => item.mode?.toLowerCase().includes('online')).length;
    const offlineConferences = data.filter(item => item.mode?.toLowerCase().includes('offline')).length;
    
    const totalFees = data.reduce((sum, item) => sum + (item.registrationFees || 0), 0);
    
    // Monthly data for current year
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      const conferencesThisMonth = data.filter(item => 
        item.statusDate && isWithinInterval(new Date(item.statusDate), { start: monthStart, end: monthEnd })
      ).length;
      
      const feesThisMonth = data
        .filter(item => item.statusDate && isWithinInterval(new Date(item.statusDate), { start: monthStart, end: monthEnd }))
        .reduce((sum, item) => sum + (item.registrationFees || 0), 0);
      
      return {
        month: format(new Date(currentYear, month), 'MMM'),
        conferences: conferencesThisMonth,
        fees: feesThisMonth,
      };
    });

    // Status distribution
    const statusData = [
      { name: 'Published', value: publishedConferences, color: '#10B981' },
      { name: 'Accepted', value: acceptedConferences, color: '#3B82F6' },
      { name: 'Communicated', value: communicatedConferences, color: '#F59E0B' },
    ].filter(item => item.value > 0);

    // Mode distribution
    const modeData = [
      { name: 'Online', value: onlineConferences, color: '#8B5CF6' },
      { name: 'Offline', value: offlineConferences, color: '#06B6D4' },
    ].filter(item => item.value > 0);

    // Recent conferences (last 6 months)
    const sixMonthsAgo = subMonths(currentDate, 6);
    const recentConferences = data.filter(item => 
      item.statusDate && new Date(item.statusDate) >= sixMonthsAgo
    ).length;

    return {
      totalConferences,
      publicConferences,
      privateConferences,
      publishedConferences,
      acceptedConferences,
      communicatedConferences,
      onlineConferences,
      offlineConferences,
      totalFees,
      monthlyData,
      statusData,
      modeData,
      recentConferences,
      growthRate: totalConferences > 0 ? (recentConferences / totalConferences) * 100 : 0,
    };
  }, [data]);

  // Table columns definition
  const columns: ColumnDef<ExtendedConference>[] = [
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
      accessorKey: "conferenceName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Conference Name
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
          <div className="font-medium truncate">{row.getValue("conferenceName")}</div>
          {row.original.typeOfConference && (
            <div className="text-xs text-gray-500 truncate">
              {row.original.typeOfConference}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "mode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Mode
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
        const mode = row.getValue("mode") as string;
        if (!mode) return "-";
        const modeColors = {
          online: "bg-purple-100 text-purple-800",
          offline: "bg-cyan-100 text-cyan-800",
        };
        const colorKey = mode.toLowerCase().includes('online') ? 'online' : 'offline';
        return (
          <Badge className={`${modeColors[colorKey]} text-xs`}>
            {mode}
          </Badge>
        );
      },
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
      accessorKey: "indexOfConference",
      header: "Index",
      cell: ({ row }) => {
        const index = row.getValue("indexOfConference") as string;
        return index || "-";
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
        const conference = row.original;

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
                  setEditingConference(conference);
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
                  setDeletingId(conference.id);
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
  const fetchConferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/teacher/conferences?teacherId=me");
      setData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching conferences:", error);
      toast.error("Failed to fetch conferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, []);

  // Delete handlers
  const handleDelete = async (id: string) => {
    try {
      await axios.delete("/api/teacher/conferences", {
        data: { ids: [id] },
      });
      toast.success("Conference deleted successfully");
      await fetchConferences();
    } catch (error) {
      console.error("Error deleting conference:", error);
      toast.error("Failed to delete conference");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    try {
      await axios.delete("/api/teacher/conferences", {
        data: { ids: selectedIds },
      });
      toast.success(`${selectedIds.length} conference(s) deleted successfully`);
      setRowSelection({});
      await fetchConferences();
    } catch (error) {
      console.error("Error deleting conferences:", error);
      toast.error("Failed to delete conferences");
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setStatusFilter("all");
    setModeFilter("all");
    setDateFilters({
      statusDate: {},
    });
    table.resetColumnFilters();
  };

  const hasActiveFilters = 
    globalFilter !== "" || 
    columnFilters.length > 0 || 
    statusFilter !== "all" ||
    modeFilter !== "all" ||
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/40 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            Conference Management
          </h1>
          <p className="text-slate-600 font-medium">
            Manage your conference presentations and submissions with detailed analytics
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Conference
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
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Conferences</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {analytics.totalConferences}
                </div>
                <div className="flex items-center text-white/80">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">{analytics.publicConferences} public</span>
                  </div>
                  <div className="w-1 h-1 bg-white/60 rounded-full mx-2"></div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">{analytics.privateConferences} private</span>
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
                  {analytics.publishedConferences}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-white to-green-200 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${analytics.totalConferences > 0 ? ((analytics.publishedConferences / analytics.totalConferences) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {analytics.totalConferences > 0 ? ((analytics.publishedConferences / analytics.totalConferences) * 100).toFixed(1) : 0}%
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
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Online vs Offline</CardTitle>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {analytics.onlineConferences}/{analytics.offlineConferences}
                </div>
                <div className="flex items-center text-white/80">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm font-medium">Online to offline ratio</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Conferences Chart */}
            <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-100/30 to-teal-100/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Monthly Conferences
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">Conference submissions throughout the year</p>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conferences" fill="url(#cyanGradient)" />
                    <defs>
                      <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-green-100/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Status Distribution
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">Current status of all conferences</p>
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
                  <CardTitle>Conferences Data</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage and filter your conference records
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
                    onClick={fetchConferences}
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
                          placeholder="Search conferences..."
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

                    {/* Mode Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Mode</Label>
                      <Select value={modeFilter} onValueChange={setModeFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All modes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modes</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
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
                    {table.getCoreRowModel().rows.length} conference(s)
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
                          No conferences found.
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

      {/* Add Conference Dialog */}
      <AddConferenceDrawer
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchConferences}
      />

      {/* Edit Conference Dialog */}
      <EditConferenceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        conference={
          editingConference
            ? {
                ...editingConference,
                statusDate: editingConference.statusDate
                  ? typeof editingConference.statusDate === "string"
                    ? editingConference.statusDate
                    : editingConference.statusDate.toISOString()
                  : "",
              }
            : null
        }
        onSuccess={fetchConferences}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              conference record.
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
            <AlertDialogTitle>Delete Selected Conferences?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {Object.keys(rowSelection).length} selected conference(s).
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
              Delete {Object.keys(rowSelection).length} Conference(s)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
