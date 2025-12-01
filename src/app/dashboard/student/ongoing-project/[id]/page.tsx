"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  GitBranch,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OngoingProject {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  status: string;
  documentUrl?: string;
  imageUrl?: string;
  repositoryUrl?: string;
  startDate?: string;
  expectedEndDate?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  };
  advisors: {
    advisor: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }[];
  members: {
    member: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    role: string;
  }[];
}

export default function OngoingProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [project, setProject] = useState<OngoingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ongoing-project/${params.id}`);
      if (response.data.success) {
        setProject(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ongoing project:", error);
      toast.error("Failed to load project");
      router.push("/dashboard/student/ongoing-project");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await axios.delete(`/api/ongoing-project/${params.id}`);
      if (response.data.success) {
        toast.success("Project deleted successfully");
        router.push("/dashboard/student/ongoing-project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: "secondary" as const, icon: Clock, label: "Draft", className: undefined },
      IN_PROGRESS: { variant: "default" as const, icon: AlertCircle, label: "In Progress", className: "bg-blue-500" },
      ON_HOLD: { variant: "default" as const, icon: AlertCircle, label: "On Hold", className: "bg-yellow-500" },
      COMPLETED: { variant: "default" as const, icon: CheckCircle, label: "Completed", className: "bg-green-500" },
      CANCELLED: { variant: "destructive" as const, icon: XCircle, label: "Cancelled", className: undefined },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const StatusIcon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <StatusIcon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-6">
              The project you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push("/dashboard/student/ongoing-project")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/student/ongoing-project")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {getStatusBadge(project.status)}
                {project.repositoryUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.repositoryUrl, "_blank")}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Repository
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Updated {formatDate(project.updatedAt)}
                </div>
              </div>
              <CardTitle className="text-3xl mb-3">{project.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              {project.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/student/ongoing-project/${project.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {project.abstract || "No description provided"}
              </p>
            </CardContent>
          </Card>

          {/* Keywords / Technologies */}
          {project.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technologies & Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advisors */}
          {project.advisors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Project Advisors ({project.advisors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.advisors.map((advisor) => (
                    <div key={advisor.advisor.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={advisor.advisor.image} />
                        <AvatarFallback>{getInitials(advisor.advisor.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{advisor.advisor.name}</div>
                        <div className="text-sm text-muted-foreground">{advisor.advisor.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {project.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({project.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.member.image} />
                          <AvatarFallback>{getInitials(member.member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.member.email}</div>
                        </div>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          {(project.startDate || project.expectedEndDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.startDate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Start Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{formatDate(project.startDate)}</span>
                    </div>
                  </div>
                )}
                {project.expectedEndDate && (
                  <>
                    {project.startDate && <Separator />}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Expected End Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{formatDate(project.expectedEndDate)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(project.documentUrl || project.imageUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.documentUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(project.documentUrl, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Project Documentation
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                )}
                {project.imageUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(project.imageUrl, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Cover Image
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Created</div>
                <div>{formatDateTime(project.createdAt)}</div>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground mb-1">Last Updated</div>
                <div>{formatDateTime(project.updatedAt)}</div>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground mb-1">Project Lead</div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.student.user.image} />
                    <AvatarFallback className="text-xs">
                      {getInitials(project.student.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.student.user.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
