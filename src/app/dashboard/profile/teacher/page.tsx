"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherProfileEditDialog } from "@/components/dashboard/TeacherProfileEditDialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  GraduationCap,
  Edit,
  Loader2,
  FileText,
  BookOpen,
  Award,
  Users,
  Copyright as CopyrightIcon,
  Lightbulb,
  BookMarked,
  Wallet,
  Handshake,
  FlaskConical
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

export default function TeacherProfilePage() {
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

  const teacher = profile?.teacherProfile;
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
                    <p className="text-muted-foreground">{teacher?.designation}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{profile?.role}</Badge>
                      {teacher?.isAvailableForGuidance && (
                        <Badge variant="secondary">Available for Guidance</Badge>
                      )}
                    </div>
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
                  {teacher?.officialEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{teacher.officialEmail}</span>
                    </div>
                  )}
                  {teacher?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{teacher.phoneNumber}</span>
                    </div>
                  )}
                  {teacher?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{teacher.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patents</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.patents || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journals</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.journals || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conferences</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conferences || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Book Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.bookChapters || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Copyrights</CardTitle>
              <CopyrightIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.copyrights || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grants</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.grants || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FDPs</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fdps || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certifications</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.certifications || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Guided</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.advisedPapers || 0) + (stats?.advisedProjects || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{teacher?.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{teacher?.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Affiliation</p>
                <p className="font-medium">{teacher?.affiliation}</p>
              </div>
              {teacher?.experience && (
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{teacher.experience} years</p>
                </div>
              )}
            </div>
            
            {teacher?.qualification && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Qualification</p>
                  <p className="font-medium">{teacher.qualification}</p>
                </div>
              </>
            )}
            
            {teacher?.subjectOfInterest && teacher.subjectOfInterest.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Areas of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjectOfInterest.map((subject: string) => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Work Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Publications & Work</CardTitle>
            <CardDescription>
              Your latest research contributions and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="patents" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="patents">Patents</TabsTrigger>
                <TabsTrigger value="journals">Journals</TabsTrigger>
                <TabsTrigger value="conferences">Conferences</TabsTrigger>
                <TabsTrigger value="bookChapters">Book Chapters</TabsTrigger>
                <TabsTrigger value="copyrights">Copyrights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="patents" className="space-y-4">
                {teacher?.patents && teacher.patents.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.patents.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{item.patent.title}</h4>
                        {item.patent.patentNumber && (
                          <p className="text-sm text-muted-foreground">
                            Patent No: {item.patent.patentNumber}
                          </p>
                        )}
                        {item.patent.grantedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Granted: {format(new Date(item.patent.grantedAt), "MMM dd, yyyy")}
                          </p>
                        )}
                        <Badge className="mt-2" variant={item.patent.isPublic ? "default" : "secondary"}>
                          {item.patent.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    ))}
                    <Link href="/dashboard/faculty/patent">
                      <Button variant="outline" className="w-full">View All Patents</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No patents yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="journals" className="space-y-4">
                {teacher?.journals && teacher.journals.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.journals.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{item.journal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.journal.journalName}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{item.journal.status}</Badge>
                          {item.journal.isPublic && <Badge>Public</Badge>}
                        </div>
                      </div>
                    ))}
                    <Link href="/dashboard/faculty/journal">
                      <Button variant="outline" className="w-full">View All Journals</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No journal publications yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="conferences" className="space-y-4">
                {teacher?.conferences && teacher.conferences.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.conferences.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{item.conference.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.conference.conferenceName}
                        </p>
                        {item.conference.conferenceStartDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Date: {format(new Date(item.conference.conferenceStartDate), "MMM dd, yyyy")}
                          </p>
                        )}
                        <Badge className="mt-2" variant="outline">{item.conference.status}</Badge>
                      </div>
                    ))}
                    <Link href="/dashboard/faculty/conference">
                      <Button variant="outline" className="w-full">View All Conferences</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No conference papers yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="bookChapters" className="space-y-4">
                {teacher?.bookChapters && teacher.bookChapters.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.bookChapters.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{item.bookChapter.title}</h4>
                        {item.bookChapter.bookTitle && (
                          <p className="text-sm text-muted-foreground">
                            Book: {item.bookChapter.bookTitle}
                          </p>
                        )}
                        <Badge className="mt-2" variant="outline">{item.bookChapter.status}</Badge>
                      </div>
                    ))}
                    <Link href="/dashboard/faculty/bookchapter">
                      <Button variant="outline" className="w-full">View All Book Chapters</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No book chapters yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="copyrights" className="space-y-4">
                {teacher?.copyrights && teacher.copyrights.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.copyrights.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{item.copyright.title}</h4>
                        {item.copyright.copyrightNumber && (
                          <p className="text-sm text-muted-foreground">
                            Copyright No: {item.copyright.copyrightNumber}
                          </p>
                        )}
                        {item.copyright.grantedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Granted: {format(new Date(item.copyright.grantedAt), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    ))}
                    <Link href="/dashboard/faculty/copyright">
                      <Button variant="outline" className="w-full">View All Copyrights</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No copyrights yet</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {profile && (
        <TeacherProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProfile}
          profile={profile}
        />
      )}
    </>
  );
}
