"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Edit,
  Loader2,
  Users,
  GraduationCap,
  FileText,
  Briefcase,
  Award,
  Trophy,
  Shield,
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile");
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error || "Failed to fetch profile");
      }
    } catch (err) {
      setError("Failed to fetch profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Admin Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.image} alt={profile?.name} />
                <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{profile?.name}</h1>
                    <p className="text-muted-foreground">System Administrator</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {profile?.role}
                      </Badge>
                      <Badge variant="secondary">Full Access</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  {profile?.createdAt && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Member since {new Date(profile.createdAt).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">System Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active registered users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered students
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Faculty members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalResearchPapers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Submitted papers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Statistics */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Activity Statistics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ongoing Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOngoingProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active student projects
                </p>
                <Link href="/dashboard/admin/ongoing-projects">
                  <Button variant="link" size="sm" className="px-0 mt-2">
                    View Projects →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAchievements || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Published achievements
                </p>
                <Link href="/dashboard/admin/achievements">
                  <Button variant="link" size="sm" className="px-0 mt-2">
                    Manage Achievements →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCompetitions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Upcoming competitions
                </p>
                <Link href="/dashboard/admin/competitions">
                  <Button variant="link" size="sm" className="px-0 mt-2">
                    Manage Competitions →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/admin/teachers">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                  <Users className="h-5 w-5 mb-2" />
                  <span className="font-semibold">Manage Teachers</span>
                  <span className="text-xs text-muted-foreground">Add or edit faculty</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/admin/students">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                  <GraduationCap className="h-5 w-5 mb-2" />
                  <span className="font-semibold">Manage Students</span>
                  <span className="text-xs text-muted-foreground">View student profiles</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/admin/research-papers">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                  <FileText className="h-5 w-5 mb-2" />
                  <span className="font-semibold">Review Papers</span>
                  <span className="text-xs text-muted-foreground">Approve submissions</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/admin/userlist">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                  <Shield className="h-5 w-5 mb-2" />
                  <span className="font-semibold">User Management</span>
                  <span className="text-xs text-muted-foreground">Manage all users</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Student to Teacher Ratio</span>
                <span className="font-semibold">
                  {stats?.totalTeachers > 0 
                    ? (stats?.totalStudents / stats?.totalTeachers).toFixed(1)
                    : 0} : 1
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Papers per Student</span>
                <span className="font-semibold">
                  {stats?.totalStudents > 0 
                    ? (stats?.totalResearchPapers / stats?.totalStudents).toFixed(2)
                    : 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Projects per Student</span>
                <span className="font-semibold">
                  {stats?.totalStudents > 0 
                    ? (stats?.totalOngoingProjects / stats?.totalStudents).toFixed(2)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
