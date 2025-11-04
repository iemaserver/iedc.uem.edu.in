"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Download, Filter, Plus, Search, TrendingUp, Clock, Calendar, Users } from "lucide-react";
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
import { FDPTable } from "../_components/fdpTable";
import { FDPAddForm } from "../_components/fdpAddForm";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface FDP {
  id: string;
  name: string;
  organizedBy?: string | null;
  duration?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  topic?: string | null;
  remarks?: string | null;
  isPublic: boolean;
  teacherId: string;
}

interface FDPAnalytics {
  totalFDPs: number;
  fdpsByYear: Record<number, number>;
}

interface FDPResponse {
  fdps: FDP[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  analytics: FDPAnalytics;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

export default function FDPPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [limit] = useState(10);

  const { data, isLoading, error, refetch } = useQuery<FDPResponse>({
    queryKey: ["fdps", currentPage, searchTerm, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await axios.get(`/api/teacher/fdps?${params}`);
      return response.data;
    },
  });

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/teacher/fdps?export=csv`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fdps.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("FDP data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };


  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Error loading FDP data. Please try again later.
        </div>
      </div>
    );
  }

  const yearlyData = data?.analytics.fdpsByYear ? Object.entries(data.analytics.fdpsByYear).map(([year, count]) => ({
    year: parseInt(year),
    fdps: count,
  })).sort((a, b) => a.year - b.year) : [];

  const currentYear = new Date().getFullYear();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Development Programs</h1>
          <p className="text-muted-foreground">
            Manage your professional development and training records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="hidden md:flex">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add FDP
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fdps">All FDPs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total FDPs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.analytics.totalFDPs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Professional development programs
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.analytics.totalDuration || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  Training hours completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(data?.analytics.totalFees || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Registration costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics.totalFDPs ? Math.round((data.analytics.totalDuration || 0) / data.analytics.totalFDPs) : 0} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Per program
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>FDP Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data?.analytics.statusStats || {}).map(([status, stats]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadgeColor(status as FDPStatus)}>
                          {status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stats.count} programs
                        </span>
                      </div>
                      <span className="font-medium">{stats.duration} days</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly FDP Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'fdps' ? `${value} FDPs` : `${value} days`,
                      name === 'fdps' ? 'Programs' : 'Duration'
                    ]} />
                    <Bar dataKey="fdps" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Duration by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value} days`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="duration"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} days`, 'Duration']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FDP Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'fdps' ? `${value} FDPs` : `${value} days`,
                      name === 'fdps' ? 'Programs' : 'Duration'
                    ]} />
                    <Area type="monotone" dataKey="duration" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fdps" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search FDP title, organizer, or topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={FDPStatus.UPCOMING}>Upcoming</SelectItem>
                    <SelectItem value={FDPStatus.ONGOING}>Ongoing</SelectItem>
                    <SelectItem value={FDPStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={FDPStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All FDPs ({data?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <FDPTable 
                data={data?.fdps || []}
                loading={isLoading}
                currentPage={currentPage}
                totalPages={data?.totalPages || 1}
                onPageChange={setCurrentPage}
                onRefresh={refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Form */}
      <FDPAddForm 
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        onSuccess={() => {
          refetch();
          setIsAddFormOpen(false);
        }}
      />
    </div>
  );
}
