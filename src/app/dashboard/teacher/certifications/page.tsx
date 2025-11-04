"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Download, Filter, Plus, Search, Award, Calendar, Shield } from "lucide-react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificationTable } from "../_components/certificationTable";
import { CertificationAddForm } from "../_components/certificationAddForm";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Certification {
  id: string;
  name: string;
  certificationName: string;
  offeredBy?: string | null;
  completedAt?: string | null;
  link?: string | null;
  remarks?: string | null;
  isPublic: boolean;
  teacherId: string;
}

interface CertificationAnalytics {
  totalCertifications: number;
  certsByYear: Record<number, number>;
}

interface CertificationResponse {
  certifications: Certification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  analytics: CertificationAnalytics;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

export default function CertificationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [limit] = useState(10);

  const { data, isLoading, error, refetch } = useQuery<CertificationResponse>({
    queryKey: ["certifications", currentPage, searchTerm, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await axios.get(`/api/teacher/certifications?${params}`);
      return response.data;
    },
  });

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/teacher/certifications?export=csv`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certifications.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Certification data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Error loading certification data. Please try again later.
        </div>
      </div>
    );
  }

  const yearlyData = data?.analytics.certsByYear ? Object.entries(data.analytics.certsByYear).map(([year, count]) => ({
    year: parseInt(year),
    certifications: count,
  })).sort((a, b) => a.year - b.year) : [];

  const currentYear = new Date().getFullYear();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
          <p className="text-muted-foreground">
            Manage your professional certifications and credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="hidden md:flex">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="certifications">All Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certifications</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.analytics.totalCertifications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Professional credentials
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics.certsByYear[currentYear] || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Certifications earned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Certifications</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data?.certifications?.filter(cert => cert.isPublic).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Visible to public
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Yearly Certification Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Certification Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData.slice(-5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} certifications`, 'Count']} />
                  <Bar dataKey="certifications" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certification Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} certifications`, 'Count']} />
                  <Area type="monotone" dataKey="certifications" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
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
                      placeholder="Search certification name, issuer, or organization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Certifications ({data?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <CertificationTable 
                data={data?.certifications || []}
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
      <CertificationAddForm 
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
