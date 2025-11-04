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
  X,
  Users,
  FileText,
  Calendar,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import axios from 'axios';
import { Patent } from '@prisma/client';
import  AddPatentDrawer  from '../_components/patentAddForm';
import EditPatentDialog from '../_components/patentEditDialog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface PatentWithInventors extends Patent {
  inventors: {
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  }[];
}

interface PatentStats {
  total: number;
  public: number;
  private: number;
  filed: number;
  granted: number;
  pending: number;
  monthlyData: { month: string; count: number }[];
  statusData: { status: string; count: number; color: string }[];
  countryData: { country: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PatentManagement() {
  const [data, setData] = useState<PatentWithInventors[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PatentStats>({
    total: 0,
    public: 0,
    private: 0,
    filed: 0,
    granted: 0,
    pending: 0,
    monthlyData: [],
    statusData: [],
    countryData: []
  });
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Dialog states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatentId, setSelectedPatentId] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Define columns
  const columns = useMemo<ColumnDef<PatentWithInventors>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{row.getValue('title')}</div>
          <div className="flex items-center gap-2">
            {row.original.applicationNo && (
              <Badge variant="outline" className="text-xs">
                {row.original.applicationNo}
              </Badge>
            )}
            {row.original.isPublic ? (
              <Badge variant="default" className="text-xs bg-green-500">
                <Eye className="h-3 w-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <EyeOff className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'inventors',
      header: 'Inventors',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.inventors.slice(0, 2).map((inventor, index) => (
            <div key={index} className="text-sm">
              {inventor.user.fullName}
            </div>
          ))}
          {row.original.inventors.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.inventors.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'applicant',
      header: 'Applicant',
      cell: ({ row }) => (
        <div className="text-sm max-w-32 truncate" title={row.getValue('applicant')}>
          {row.getValue('applicant')}
        </div>
      ),
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('country') || 'Not specified'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const patent = row.original;
        let status = 'Filed';
        let color = 'bg-blue-500';
        
        if (patent.grantedAt) {
          status = 'Granted';
          color = 'bg-green-500';
        } else if (patent.publishedAt) {
          status = 'Published';
          color = 'bg-purple-500';
        } else if (patent.submittedAt) {
          status = 'Submitted';
          color = 'bg-orange-500';
        }
        
        return (
          <Badge className={`text-white ${color}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'filedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Filed Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('filedAt') as Date;
        return date ? format(new Date(date), 'MMM dd, yyyy') : 'Not filed';
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const patent = row.original;
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
                  setSelectedPatentId(patent.id);
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {patent.publicationLink && (
                <DropdownMenuItem asChild>
                  <a href={patent.publicationLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Publication
                  </a>
                </DropdownMenuItem>
              )}
              {patent.patentLink && (
                <DropdownMenuItem asChild>
                  <a href={patent.patentLink} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    View Patent
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPatentId(patent.id);
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  // Create table instance
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
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/teacher/patent?teacherId=me');
      const patents = response.data.data || [];
      setData(patents);
      console.log("patent is", patents)
      
      // Calculate stats
      const total = patents.length;
      const publicCount = patents.filter((p: PatentWithInventors) => p.isPublic).length;
      const privateCount = total - publicCount;
      const filed = patents.filter((p: PatentWithInventors) => p.filedAt).length;
      const granted = patents.filter((p: PatentWithInventors) => p.grantedAt).length;
      const pending = total - granted;
      
      // Monthly data for charts
      const monthlyData = generateMonthlyData(patents);
      const statusData = generateStatusData(patents);
      const countryData = generateCountryData(patents);
      
      setStats({
        total,
        public: publicCount,
        private: privateCount,
        filed,
        granted,
        pending,
        monthlyData,
        statusData,
        countryData
      });
      
    } catch (error) {
      console.error('Error fetching patents:', error);
      toast.error('Failed to fetch patents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper functions for chart data
  const generateMonthlyData = (patents: PatentWithInventors[]) => {
    const monthCounts: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(month => monthCounts[month] = 0);
    
    patents.forEach(patent => {
      if (patent.filedAt) {
        const month = format(new Date(patent.filedAt), 'MMM');
        monthCounts[month]++;
      }
    });
    
    return months.map(month => ({
      month,
      count: monthCounts[month]
    }));
  };

  const generateStatusData = (patents: PatentWithInventors[]) => {
    const statusCounts = {
      filed: 0,
      submitted: 0,
      published: 0,
      granted: 0
    };
    
    patents.forEach(patent => {
      if (patent.grantedAt) statusCounts.granted++;
      else if (patent.publishedAt) statusCounts.published++;
      else if (patent.submittedAt) statusCounts.submitted++;
      else statusCounts.filed++;
    });
    
    return [
      { status: 'Filed', count: statusCounts.filed, color: '#0088FE' },
      { status: 'Submitted', count: statusCounts.submitted, color: '#00C49F' },
      { status: 'Published', count: statusCounts.published, color: '#FFBB28' },
      { status: 'Granted', count: statusCounts.granted, color: '#FF8042' },
    ];
  };

  const generateCountryData = (patents: PatentWithInventors[]) => {
    const countryCounts: { [key: string]: number } = {};
    
    patents.forEach(patent => {
      const country = patent.country || 'Not specified';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    
    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      await axios.delete('/api/teacher/patent', {
        data: { ids: [selectedPatentId] }
      });
      
      setData(prev => prev.filter(item => item.id !== selectedPatentId));
      toast.success('Patent deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPatentId('');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete patent');
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;
    
    try {
      await axios.delete('/api/teacher/patent', {
        data: { ids: selectedIds }
      });
      
      setData(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast.success(`${selectedIds.length} patents deleted successfully`);
      setRowSelection({});
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete patents');
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(patent => {
      const matchesCountry = selectedCountry === 'all' || patent.country === selectedCountry;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'granted' && patent.grantedAt) ||
        (selectedStatus === 'published' && patent.publishedAt && !patent.grantedAt) ||
        (selectedStatus === 'submitted' && patent.submittedAt && !patent.publishedAt) ||
        (selectedStatus === 'filed' && !patent.submittedAt);
      
      return matchesCountry && matchesStatus;
    });
  }, [data, selectedCountry, selectedStatus]);

  const uniqueCountries = useMemo(() => {
    const countries = data.map(p => p.country).filter((country): country is string => Boolean(country));
    return Array.from(new Set(countries));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Loading patents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Patent Management
          </h1>
          <p className="text-slate-600">
            Manage your intellectual property portfolio with advanced analytics
          </p>
        </div>
        <Button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Patent
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Patents</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden mt-3">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.total > 0 ? Math.min((stats.public / stats.total) * 100, 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-2">
              {stats.public} public, {stats.private} private
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Granted Patents</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats.granted}</div>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden mt-3">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.total > 0 ? (stats.granted / stats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-2">
              {stats.total > 0 ? Math.round((stats.granted / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Pending Patents</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats.pending}</div>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden mt-3">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-2">
              In various stages of approval
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Filed This Year</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats.filed}</div>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden mt-3">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.filed > 0 ? Math.min((stats.filed / 12) * 100, 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-2">
              Active applications
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-500px bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="table" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <FileText className="h-4 w-4" />
              Patent List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Monthly Patent Filings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        fill="url(#colorGradient)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Patent Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="count"
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count, percent }) => 
                          `${status}: ${count} (${percent ? (percent * 100).toFixed(0) : 0}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {stats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Patent Progress Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.countryData.map((item, index) => (
                      <div key={item.country} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.country}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <Progress 
                          value={(item.count / Math.max(...stats.countryData.map(d => d.count))) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table">
            {/* Enhanced Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="shadow-sm border-0 bg-gradient-to-r from-white to-slate-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Patent Records</CardTitle>
                    <Button
                      onClick={() => setIsAddDrawerOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Patent
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
                            placeholder="Search patents..."
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
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-40 h-10">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="filed">Filed</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="granted">Granted</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Country Filter */}
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-40 h-10">
                            <SelectValue placeholder="Filter by country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {uniqueCountries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Page Size */}
                        <Select
                          value={table.getState().pagination.pageSize.toString()}
                          onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                          <SelectTrigger className="w-20 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Column Visibility */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10">
                              <Filter className="h-4 w-4 mr-2" />
                              Columns
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
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

                        {/* Refresh Button */}
                        <Button 
                          onClick={fetchData} 
                          variant="outline" 
                          className="h-10 px-3"
                          title="Refresh data"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    {Object.keys(rowSelection).length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                            {Object.keys(rowSelection).length}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} patent{Object.keys(rowSelection).length !== 1 ? 's' : ''} selected
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRowSelection({})}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
             

                  {/* Enhanced Table */}
                  <div className="rounded-xl border border-slate-200/60 shadow-xl bg-white/90 backdrop-blur-md overflow-hidden">
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
                        <AnimatePresence>
                          {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                              <motion.tr
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={`group relative transition-all duration-300 border-b hover:bg-muted/50 data-[state=selected]:bg-muted ${
                                  index % 2 === 0 
                                    ? 'bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50' 
                                    : 'bg-slate-50/30 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70'
                                } hover:shadow-md hover:scale-[1.01] border-b border-slate-100 border-l-0 hover:border-l-4 hover:border-l-blue-500`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </TableCell>
                                ))}
                              </motion.tr>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                              >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                  <p className="text-muted-foreground">No patents found</p>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsAddDrawerOpen(true)}
                                  >
                                    Add your first patent
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between space-x-2 p-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {table.getFilteredSelectedRowModel().rows.length} of{" "}
                      {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                          value={`${table.getState().pagination.pageSize}`}
                          onValueChange={(value) => {
                            table.setPageSize(Number(value));
                          }}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                              <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => table.setPageIndex(0)}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronDown className="h-4 w-4 -rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronDown className="h-4 w-4 -rotate-90" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <AddPatentDrawer
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        setData={setData}
      />

      <EditPatentDialog
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        patentId={selectedPatentId}
        onUpdate={(updatedPatent) => {
          setData(prev => prev.map(item => 
            item.id === updatedPatent.id ? { ...item, ...updatedPatent } : item
          ));
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patent
              from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
