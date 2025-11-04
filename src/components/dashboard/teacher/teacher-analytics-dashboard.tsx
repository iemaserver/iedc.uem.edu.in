"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { 
  GraduationCap,
  FileCheck,
  ClipboardList,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  AlertCircle,
  BarChart3,
  Target,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";
import Link from "next/link";

interface TeacherAnalyticsData {
  period: string;
  metrics: {
    researchPapers: {
      total: number;
      uploaded: number;
      underReview: number;
      accepted: number;
      rejected: number;
      approvalRate: string;
    };
    ongoingProjects: {
      total: number;
      ongoing: number;
      completed: number;
      accepted: number;
      rejected: number;
      approvalRate: string;
    };
    pendingReview: {
      researchPapers: number;
      ongoingProjects: number;
      total: number;
    };
    totalAdvised: number;
    uniqueStudents: number;
    overallApprovalRate: string;
  };
  reviewActivityData: Array<{
    date: string;
    reviewed: number;
    researchPapers: number;
    ongoingProjects: number;
  }>;
  statusDistribution: {
    researchPapers: Array<{
      name: string;
      value: number;
      status: string;
    }>;
    ongoingProjects: Array<{
      name: string;
      value: number;
      status: string;
    }>;
  };
  monthlyReviewData: Array<{
    month: string;
    total: number;
    accepted: number;
    approvalRate: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    studentName: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

const statusColors = {
  UPLOADED: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3B82F6" },
  UNDER_REVIEW: { bg: "bg-yellow-100", text: "text-yellow-800", hex: "#F59E0B" },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-800", hex: "#10B981" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", hex: "#EF4444" },
  ONGOING: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3B82F6" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-800", hex: "#10B981" },
};

export function TeacherAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<TeacherAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/teacher/analytics?period=${period}`);
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "UPLOADED":
      case "ONGOING":
        return <Clock className="h-4 w-4" />;
      case "UNDER_REVIEW":
        return <Eye className="h-4 w-4" />;
      case "ACCEPTED":
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your advisory activities and review performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {analyticsData.metrics.pendingReview.total > 0 && (
            <Link href="/dashboard/teacher/submissions">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                {analyticsData.metrics.pendingReview.total} Pending
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Advised</p>
                <p className="text-2xl font-bold text-blue-900">
                  {analyticsData.metrics.totalAdvised}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Approval Rate</p>
                <p className="text-2xl font-bold text-green-900">
                  {analyticsData.metrics.overallApprovalRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-900">
                  {analyticsData.metrics.pendingReview.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Unique Students</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analyticsData.metrics.uniqueStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Review Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Review Activity
            </CardTitle>
            <CardDescription>Your review activity over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.reviewActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="researchPapers"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Research Papers"
                />
                <Area
                  type="monotone"
                  dataKey="ongoingProjects"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Ongoing Projects"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Monthly Review Performance
            </CardTitle>
            <CardDescription>Review count and approval rates by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analyticsData.monthlyReviewData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total" fill="#3B82F6" name="Total Reviews" />
                <Bar yAxisId="left" dataKey="accepted" fill="#10B981" name="Accepted" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="approvalRate" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  name="Approval Rate (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Research Paper Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Research Paper Status</CardTitle>
            <CardDescription>Distribution of advised research paper statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.statusDistribution.researchPapers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution.researchPapers}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.statusDistribution.researchPapers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status as keyof typeof statusColors]?.hex} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No research papers advised yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Project Status</CardTitle>
            <CardDescription>Distribution of advised ongoing project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.statusDistribution.ongoingProjects.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution.ongoingProjects}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.statusDistribution.ongoingProjects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status as keyof typeof statusColors]?.hex} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No ongoing projects advised yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Research Paper Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Research Papers Advised
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Papers</span>
                <span className="font-semibold">{analyticsData.metrics.researchPapers.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="font-semibold text-green-600">{analyticsData.metrics.researchPapers.accepted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Under Review</span>
                <span className="font-semibold text-yellow-600">{analyticsData.metrics.researchPapers.underReview}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">{analyticsData.metrics.researchPapers.rejected}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                  <span className="font-bold text-lg text-blue-600">{analyticsData.metrics.researchPapers.approvalRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ongoing Project Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ongoing Projects Advised
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Projects</span>
                <span className="font-semibold">{analyticsData.metrics.ongoingProjects.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="font-semibold text-green-600">{analyticsData.metrics.ongoingProjects.accepted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ongoing</span>
                <span className="font-semibold text-blue-600">{analyticsData.metrics.ongoingProjects.ongoing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">{analyticsData.metrics.ongoingProjects.rejected}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                  <span className="font-bold text-lg text-green-600">{analyticsData.metrics.ongoingProjects.approvalRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Advisory Activity
          </CardTitle>
          <CardDescription>Your latest advisory activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {activity.type === "research-paper" ? (
                        <FileCheck className="h-4 w-4 text-gray-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">
                        by {activity.studentName} • {activity.type === "research-paper" ? "Research Paper" : "Ongoing Project"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${statusColors[activity.status as keyof typeof statusColors]?.bg} ${statusColors[activity.status as keyof typeof statusColors]?.text}`}>
                      {getStatusIcon(activity.status)}
                      <span className="ml-1">{activity.status}</span>
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(activity.updatedAt), "MMM dd")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent advisory activity</p>
              <p className="text-sm">Start advising student submissions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}