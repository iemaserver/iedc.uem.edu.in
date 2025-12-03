"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  FileText,
  Briefcase,
  Award,
  Trophy,
  Plus,
  Loader2,
  ArrowRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isFuture } from "date-fns";
import toast from "react-hot-toast";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch profile data
      const profileRes = await fetch("/api/profile");
      const profileData = await profileRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }

      // Fetch upcoming competitions
      const compRes = await fetch("/api/competition");
      const compData = await compRes.json();

      if (compData.success) {
        // Filter for upcoming published competitions
        const upcoming = compData.data
          .filter((comp: any) => comp.isPublished && isFuture(parseISO(comp.startDate)))
          .sort((a: any, b: any) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
          .slice(0, 3);
        setCompetitions(upcoming);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = profile?.stats || {};
  const student = profile?.studentProfile;
  const recentPapers = student?.researchPapers?.slice(0, 3) || [];
  const recentProjects = student?.ongoingProjects?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Student Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {profile?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your academic journey
            </p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.image} alt={profile?.name} />
            <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.researchPapers || 0}</div>
              <p className="text-xs text-muted-foreground">Total submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ongoingProjects || 0}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.achievements || 0}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(student?.researchPapers?.filter((p: any) => p.status === "PUBLISHED")?.length || 0) +
                  (student?.ongoingProjects?.filter((p: any) => p.status === "PUBLISHED")?.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Papers & projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump right into your work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/paper/upload">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Submit Paper</span>
                </Button>
              </Link>
              <Link href="/dashboard/paper/project">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                  <Briefcase className="h-6 w-6" />
                  <span className="text-sm">Add Project</span>
                </Button>
              </Link>
              <Link href="/dashboard/student/achievements">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                  <Award className="h-6 w-6" />
                  <span className="text-sm">Add Achievement</span>
                </Button>
              </Link>
              <Link href="/dashboard/student/competitions">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                  <Trophy className="h-6 w-6" />
                  <span className="text-sm">View Competitions</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Research Papers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Papers
                </CardTitle>
                <Link href="/dashboard/paper/upload">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Your latest research submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPapers.length > 0 ? (
                <div className="space-y-4">
                  {recentPapers.map((paper: any) => (
                    <div key={paper.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{paper.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              paper.status === "PUBLISHED"
                                ? "default"
                                : paper.status === "APPROVED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {paper.status}
                          </Badge>
                          {paper.submittedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(paper.submittedAt), "MMM dd")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No papers yet</p>
                  <Link href="/dashboard/paper/upload">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Submit Your First Paper
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
                <Link href="/dashboard/paper/project">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Your ongoing work</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project: any) => (
                    <div key={project.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              project.status === "PUBLISHED"
                                ? "default"
                                : project.status === "APPROVED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {project.status}
                          </Badge>
                          {project.startDate && (
                            <span className="text-xs text-muted-foreground">
                              Started {format(new Date(project.startDate), "MMM yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
                  <Link href="/dashboard/paper/project">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Start Your First Project
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Competitions */}
        {competitions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Upcoming Competitions
                </CardTitle>
                <Link href="/dashboard/student/competitions">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Don't miss these opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitions.map((comp: any) => (
                  <div key={comp.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <Trophy className="h-8 w-8 text-orange-500 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">{comp.title}</h4>
                      {comp.organizer && (
                        <p className="text-sm text-muted-foreground">by {comp.organizer}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(comp.startDate), "MMM dd, yyyy")}
                        </span>
                        {comp.registrationDeadline && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-3 w-3" />
                            Register by {format(parseISO(comp.registrationDeadline), "MMM dd")}
                          </span>
                        )}
                      </div>
                      {comp.registrationLink && (
                        <Button size="sm" className="mt-3" asChild>
                          <a href={comp.registrationLink} target="_blank" rel="noopener noreferrer">
                            Register Now
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
