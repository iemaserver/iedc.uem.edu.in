"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Download, Filter, Plus, Search, TrendingUp, DollarSign, Award, Users, BarChart3 } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GrantInTable } from "../_components/grantInTable";
import { GrantInAddForm } from "../_components/grantInAddForm";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Define GrantInStatus enum based on backend
enum GrantInStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED", 
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

interface GrantIn {
  id: string;
  name: string;
  projectCode?: string | null;
  projectPI?: string | null;
  projectCoPI?: string | null;
  status?: string | null;
  appliedAt?: string | null;
  grantedAt?: string | null;
  durationMonths?: number | null;
  grantAmount?: number | null;
  utilizedAmount?: number | null;
  remainingAmount?: number | null;
  publication?: string | null;
  publicationDetails?: string | null;
  isPublic: boolean;
}

interface GrantInAnalytics {
  totalGrants: number;
  totalAmount: number;
  statusStats: Record<string, { count: number; amount: number }>;
}

interface GrantInResponse {
  grantsIn: GrantIn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  analytics: GrantInAnalytics;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

export default function GrantInPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [limit] = useState(10);
  const [data, setData] = useState<GrantInResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const response = await axios.get(`/api/teacher/grants?${params}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch grants data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, statusFilter]);

  const refetch = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      const response = await axios.get("/api/teacher/grants", {
        params: { export: true },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "grants.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful!");
    } catch (error) {
      toast.error("Export failed!");
    }
  };

  const handleFormSuccess = () => {
    setIsAddFormOpen(false);
    refetch();
    toast.success("Grant added successfully!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading grants data</div>
      </div>
    );
  }

  const grantsData = data?.grantsIn || [];
  const analytics = data?.analytics;

  const statusBadgeVariant = (status: string | null | undefined) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "COMPLETED":
        return "secondary";
      case "PENDING":
        return "outline";
      case "REJECTED":
        return "destructive";
      case "APPROVED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const statusChartData = analytics?.statusStats
    ? Object.entries(analytics.statusStats).map(([status, data]: [string, any]) => ({
        name: status,
        value: data?.count || 0,
        amount: data?.amount || 0,
      }))
    : [];

  const monthlyData = grantsData
    .filter((grant: GrantIn) => grant.appliedAt) // Only include grants with applied date
    .reduce((acc: any[], grant: GrantIn) => {
      const date = new Date(grant.appliedAt!);
      const monthYear = format(date, "MMM yyyy");
      const existing = acc.find((item) => item.month === monthYear);
      
      if (existing) {
        existing.amount += grant.grantAmount || 0;
        existing.count += 1;
      } else {
        acc.push({ 
          month: monthYear, 
          amount: grant.grantAmount || 0, 
          count: 1 
        });
      }
      
      return acc;
    }, [])
    .slice(-12);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/40 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            Grants Management
          </h1>
          <p className="text-slate-600 font-medium">
            Manage your research grants and funding records with comprehensive analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="hidden md:flex border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={() => setIsAddFormOpen(true)}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Grant
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Grants</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <Award className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {analytics?.totalGrants || 0}
            </div>
            <p className="text-white/80 text-sm font-medium">Research grants received</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-teal-600 to-cyan-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Total Funding</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              ₹{(analytics?.totalAmount || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-white/80 text-sm font-medium">Total grant amount</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Active Grants</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {analytics?.statusStats?.ACTIVE?.count || 0}
            </div>
            <p className="text-white/80 text-sm font-medium">Currently active projects</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">Success Rate</CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
              {(analytics?.totalGrants && analytics.totalGrants > 0)
                ? Math.round(((analytics?.statusStats?.[GrantInStatus.ACTIVE]?.count || 0) + (analytics?.statusStats?.[GrantInStatus.COMPLETED]?.count || 0)) / analytics.totalGrants * 100)
                : 0}%
            </div>
            <p className="text-white/80 text-sm font-medium">Grant approval rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Monthly Funding Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#059669" 
                  strokeWidth={3}
                  fill="url(#emeraldGradient)" 
                />
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-6 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Grant Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search grants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-slate-200 focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-48 border-2 border-slate-200 focus:border-emerald-400">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <GrantInTable
          data={grantsData}
          currentPage={currentPage}
          totalPages={data?.totalPages || 1}
          onPageChange={setCurrentPage}
          onRefresh={refetch}
          loading={isLoading}
        />
      </Card>

      {/* Add Grant Form */}
      <GrantInAddForm
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
