"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StudentProfileEditDialog } from "@/components/dashboard/StudentProfileEditDialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Briefcase,
  Award,
  Edit,
  Loader2
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
import { format } from "date-fns";
import Link from "next/link";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const student = profile?.studentProfile;
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
              <BreadcrumbPage>My Profile</BreadcrumbPage>
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
                    <p className="text-muted-foreground">{student?.rollNumber}</p>
                    <Badge className="mt-2">{profile?.role}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  {student?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.phoneNumber}</span>
                    </div>
                  )}
                  {student?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.address}</span>
                    </div>
                  )}
                  {student?.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(student.dateOfBirth), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.researchPapers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total submitted papers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ongoingProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.achievements || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total achievements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{student?.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{student?.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section</p>
                <p className="font-medium">{student?.section}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-medium">{student?.batch}</p>
              </div>
            </div>
            
            {(student?.guardianName || student?.guardianPhone) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Guardian Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student?.guardianName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Guardian Name</p>
                        <p className="font-medium">{student.guardianName}</p>
                      </div>
                    )}
                    {student?.guardianPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Guardian Phone</p>
                        <p className="font-medium">{student.guardianPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Research Papers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Research Papers
              </CardTitle>
              <Link href="/dashboard/paper/upload">
                <Button size="sm">Upload New Paper</Button>
              </Link>
            </div>
            <CardDescription>
              Your submitted research papers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student?.researchPapers?.length > 0 ? (
              <div className="space-y-4">
                {student.researchPapers.map((paper: any) => (
                  <div key={paper.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{paper.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {paper.abstract}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={
                            paper.status === "PUBLISHED" ? "default" :
                            paper.status === "APPROVED" ? "secondary" :
                            paper.status === "UNDER_REVIEW" ? "outline" :
                            "destructive"
                          }>
                            {paper.status}
                          </Badge>
                          {paper.keywords?.slice(0, 3).map((keyword: string) => (
                            <Badge key={keyword} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {paper.advisors?.length > 0 && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Advisors: </span>
                        {paper.advisors.map((adv: any, idx: number) => (
                          <span key={adv.id}>
                            {adv.advisor.name}
                            {idx < paper.advisors.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No research papers yet. Upload your first paper to get started!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Ongoing Projects
              </CardTitle>
              <Link href="/dashboard/paper/project">
                <Button size="sm">Add New Project</Button>
              </Link>
            </div>
            <CardDescription>
              Your current and completed projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student?.ongoingProjects?.length > 0 ? (
              <div className="space-y-4">
                {student.ongoingProjects.map((project: any) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {project.abstract}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={
                            project.status === "PUBLISHED" ? "default" :
                            project.status === "APPROVED" ? "secondary" :
                            project.status === "UNDER_REVIEW" ? "outline" :
                            "destructive"
                          }>
                            {project.status}
                          </Badge>
                          {project.keywords?.slice(0, 3).map((keyword: string) => (
                            <Badge key={keyword} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                      {project.startDate && (
                        <span>Started: {format(new Date(project.startDate), "MMM yyyy")}</span>
                      )}
                      {project.expectedEndDate && (
                        <span>Due: {format(new Date(project.expectedEndDate), "MMM yyyy")}</span>
                      )}
                    </div>
                    {project.advisors?.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Advisors: </span>
                        {project.advisors.map((adv: any, idx: number) => (
                          <span key={adv.id}>
                            {adv.advisor.name}
                            {idx < project.advisors.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No ongoing projects yet. Start your first project today!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {profile && (
        <StudentProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProfile}
          profile={profile}
        />
      )}
    </>
  );
}
