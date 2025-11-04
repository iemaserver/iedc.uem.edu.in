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
  AreaChart
} from "recharts";
import { 
  FileText, 
  FolderOpen, 
  TrendingUp, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  PlusCircle,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";

interface AnalyticsData {
  period: string;
  metrics: {
    researchPapers: {
      total: number;
      uploaded: number;
      underReview: number;
      accepted: number;
      rejected: number;
      byProjectType: {
        personal: number;
        collaborative: number;
        inIedc: number;
      };
    };
    ongoingProjects: {
      total: number;
      ongoing: number;
      completed: number;
      accepted: number;
      rejected: number;
    };
    totalSubmissions: number;
    totalCollaborators: number;
  };
  timeSeriesData: Array<{
    date: string;
    researchPapers: number;
    ongoingProjects: number;
    total: number;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
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

const projectTypeColors = {
  PERSONAL: "#8B5CF6",
  COLLABORATIVE: "#06B6D4",
  IN_IEDC: "#F59E0B",
};

export function StudentAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/student/analytics?period=${period}`);
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

  const researchPaperStatusData = [
    { name: "Uploaded", value: analyticsData.metrics.researchPapers.uploaded, color: statusColors.UPLOADED.hex },
    { name: "Under Review", value: analyticsData.metrics.researchPapers.underReview, color: statusColors.UNDER_REVIEW.hex },
    { name: "Accepted", value: analyticsData.metrics.researchPapers.accepted, color: statusColors.ACCEPTED.hex },
    { name: "Rejected", value: analyticsData.metrics.researchPapers.rejected, color: statusColors.REJECTED.hex },
  ].filter(item => item.value > 0);

  const projectStatusData = [
    { name: "Ongoing", value: analyticsData.metrics.ongoingProjects.ongoing, color: statusColors.ONGOING.hex },
    { name: "Completed", value: analyticsData.metrics.ongoingProjects.completed, color: statusColors.COMPLETED.hex },
    { name: "Accepted", value: analyticsData.metrics.ongoingProjects.accepted, color: statusColors.ACCEPTED.hex },
    { name: "Rejected", value: analyticsData.metrics.ongoingProjects.rejected, color: statusColors.REJECTED.hex },
  ].filter(item => item.value > 0);

  const projectTypeData = [
    { name: "Personal", value: analyticsData.metrics.researchPapers.byProjectType.personal, color: projectTypeColors.PERSONAL },
    { name: "Collaborative", value: analyticsData.metrics.researchPapers.byProjectType.collaborative, color: projectTypeColors.COLLABORATIVE },
    { name: "In IEDC", value: analyticsData.metrics.researchPapers.byProjectType.inIedc, color: projectTypeColors.IN_IEDC },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your research papers and ongoing projects</p>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Research Papers</p>
                <p className="text-2xl font-bold text-blue-900">
                  {analyticsData.metrics.researchPapers.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Ongoing Projects</p>
                <p className="text-2xl font-bold text-green-900">
                  {analyticsData.metrics.ongoingProjects.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Submissions</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analyticsData.metrics.totalSubmissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Collaborators</p>
                <p className="text-2xl font-bold text-orange-900">
                  {analyticsData.metrics.totalCollaborators}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Submission Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Submission Trends
            </CardTitle>
            <CardDescription>Your submission activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.timeSeriesData}>
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

        {/* Research Paper Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Research Paper Status</CardTitle>
            <CardDescription>Distribution of your research paper statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {researchPaperStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={researchPaperStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {researchPaperStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                No research papers found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Types</CardTitle>
            <CardDescription>Distribution of your project types</CardDescription>
          </CardHeader>
          <CardContent>
            {projectTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTypeData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {projectTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No project type data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Project Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Distribution of your ongoing project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                No ongoing projects found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest submissions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {activity.type === "research-paper" ? (
                        <FileText className="h-4 w-4 text-gray-600" />
                      ) : (
                        <FolderOpen className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">
                        {activity.type === "research-paper" ? "Research Paper" : "Ongoing Project"}
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
              <PlusCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Start by creating your first submission</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}