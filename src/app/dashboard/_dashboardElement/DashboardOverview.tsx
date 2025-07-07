"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChartPieLabelList } from "@/components/charts/pie-charts";
import { useChartData } from "@/hooks/useChartData";
import {
  Users,
  FileText,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { ChartBarDefault } from "@/components/charts/bar-Chart";

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalPapers: number;
  totalAchievements: number;
  pendingReviews: number;
  publishedPapers: number;
  ongoingProjects: number;
  completedProjects: number;
}

interface ChartData {
  category: string;
  count: number;
  fill: string;
}

interface RecentActivity {
  id: string;
  type: "project" | "paper" | "achievement";
  title: string;
  status: string;
  date: string;
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const { data: chartData, loading: chartLoading } = useChartData();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalPapers: 0,
    totalAchievements: 0,
    pendingReviews: 0,
    publishedPapers: 0,
    ongoingProjects: 0,
    completedProjects: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics based on user role
      const promises = [];
      
      if (session?.user?.userType === "ADMIN") {
        // Admin can see all stats
        promises.push(
          axios.get("/api/user?limit=1").then(res => res.data.pagination.total),
          axios.get("/api/paper/ongoingProject?limit=1").then(res => res.data.pagination.total),
          axios.get("/api/paper/researchPaper?limit=1").then(res => res.data.pagination.total),
          axios.get("/api/user/admin/achievement?limit=1").then(res => res.data.length || 0)
        );
      } else {
        // Faculty and students see limited stats
        promises.push(
          Promise.resolve(0), // No user count for non-admins
          axios.get("/api/paper/ongoingProject?limit=1").then(res => res.data.pagination.total),
          axios.get("/api/paper/researchPaper?limit=1").then(res => res.data.pagination.total),
          axios.get("/api/user/admin/achievement?limit=1").then(res => res.data.length || 0)
        );
      }

      const [totalUsers, totalProjects, totalPapers, totalAchievements] = await Promise.all(promises);

      // Fetch published papers
      const publishedPapersRes = await axios.get("/api/paper/published?limit=1");
      const publishedPapers = publishedPapersRes.data.pagination.total;

      // Fetch project status breakdown (mock data for now)
      const ongoingProjects = Math.floor(totalProjects * 0.7);
      const completedProjects = totalProjects - ongoingProjects;
      const pendingReviews = Math.floor(totalProjects * 0.3);

      setStats({
        totalUsers,
        totalProjects,
        totalPapers,
        totalAchievements,
        pendingReviews,
        publishedPapers,
        ongoingProjects,
        completedProjects,
      });

      // Mock recent activity (in a real app, this would come from an API)
      setRecentActivity([
        {
          id: "1",
          type: "project",
          title: "AI Research Project",
          status: "ongoing",
          date: new Date().toISOString(),
        },
        {
          id: "2",
          type: "paper",
          title: "Machine Learning Paper",
          status: "published",
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          type: "achievement",
          title: "Best Innovation Award",
          status: "completed",
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project":
        return <BookOpen className="h-4 w-4" />;
      case "paper":
        return <FileText className="h-4 w-4" />;
      case "achievement":
        return <Award className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}! Here's what's happening with your projects.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {session?.user?.userType === "ADMIN" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered students & faculty
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.ongoingProjects} ongoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPapers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPapers} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">
              Recognition & awards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/paper/project">
              <Button className="w-full" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
            </Link>
            <Link href="/dashboard/paper/upload">
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Upload Research Paper
              </Button>
            </Link>
            {session?.user?.userType === "ADMIN" && (
              <Link href="/dashboard/achievement">
                <Button className="w-full" variant="outline">
                  <Award className="mr-2 h-4 w-4" />
                  Add Achievement
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Statistics Chart */}
        <div className="md:col-span-1">
          {chartLoading ? (
            <Card className="flex flex-col h-[400px]">
              <CardHeader>
                <CardTitle>Loading Chart...</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center flex-1">
                <Clock className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : (
            <ChartPieLabelList 
              data={chartData}
              title="Your Statistics"
              description={`${session?.user?.userType} overview`}
              userType={session?.user?.userType as "ADMIN" | "FACULTY" | "STUDENT"}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Ongoing</span>
              <div className="flex items-center">
                <Badge variant="secondary">{stats.ongoingProjects}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed</span>
              <div className="flex items-center">
                <Badge variant="outline">{stats.completedProjects}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Review</span>
              <div className="flex items-center">
                <Badge variant="destructive">{stats.pendingReviews}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(activity.status)} variant="secondary">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
