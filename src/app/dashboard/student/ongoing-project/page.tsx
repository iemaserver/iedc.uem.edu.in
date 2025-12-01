"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FolderKanban,
  Plus,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  GitBranch,
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
    };
  };
  advisors: {
    advisor: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  members: {
    member: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }[];
}

export default function OngoingProjectListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ongoing-project");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ongoing projects:", error);
      toast.error("Failed to load ongoing projects");
    } finally {
      setLoading(false);
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
      <Badge variant={config.variant} className={config.className || undefined}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Ongoing Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your development projects
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/student/ongoing-project/upload")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No ongoing projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by creating your first project
            </p>
            <Button
              onClick={() => router.push("/dashboard/student/ongoing-project/upload")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/student/ongoing-project/${project.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(project.status)}
                  {project.repositoryUrl && (
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {project.abstract || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.keywords.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {project.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {project.advisors.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Advisor: {project.advisors[0].advisor.name}
                        {project.advisors.length > 1 && ` +${project.advisors.length - 1}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                  </div>

                  {project.startDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Started {formatDate(project.startDate)}</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Updated {formatDate(project.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
