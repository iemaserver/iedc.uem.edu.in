"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FileText,
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

interface ResearchPaper {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  status: string;
  documentUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  reviewedBy?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  members: {
    member: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }[];
}

export default function ResearchPaperListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/research-paper");
      if (response.data.success) {
        setPapers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching research papers:", error);
      toast.error("Failed to load research papers");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: "secondary" as const, icon: Clock, label: "Draft", className: undefined },
      SUBMITTED: { variant: "default" as const, icon: AlertCircle, label: "Submitted", className: undefined },
      UNDER_REVIEW: { variant: "default" as const, icon: Eye, label: "Under Review", className: undefined },
      APPROVED: { variant: "default" as const, icon: CheckCircle, label: "Approved", className: "bg-green-500" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, label: "Rejected", className: undefined },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const StatusIcon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
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
          <h1 className="text-3xl font-bold">My Research Papers</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your research publications
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/student/research-paper/upload")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload New Paper
        </Button>
      </div>

      {papers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No research papers yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by uploading your first research paper
            </p>
            <Button
              onClick={() => router.push("/dashboard/student/research-paper/upload")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Research Paper
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper) => (
            <Card
              key={paper.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/student/research-paper/${paper.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(paper.status)}
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {paper.abstract || "No abstract provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {paper.keywords.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {paper.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{paper.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {paper.reviewedBy && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Reviewer: {paper.reviewedBy.user.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{paper.members.length} member{paper.members.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated {formatDate(paper.updatedAt)}
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
