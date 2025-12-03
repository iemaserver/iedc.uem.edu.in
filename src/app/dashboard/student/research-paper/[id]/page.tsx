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
      image?: string;
    };
  };
  reviewedBy?: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  };
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

export default function ResearchPaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPaper();
    }
  }, [params.id]);

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/research-paper/${params.id}`);
      if (response.data.success) {
        setPaper(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching research paper:", error);
      toast.error("Failed to load research paper");
      router.push("/dashboard/student/research-paper");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await axios.delete(`/api/research-paper/${params.id}`);
      if (response.data.success) {
        toast.success("Research paper deleted successfully");
        router.push("/dashboard/student/research-paper");
      }
    } catch (error) {
      console.error("Error deleting research paper:", error);
      toast.error("Failed to delete research paper");
    } finally {
      setDeleting(false);
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

  if (!paper) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Research paper not found</h3>
            <p className="text-muted-foreground mb-6">
              The research paper you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push("/dashboard/student/research-paper")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Research Papers
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
        onClick={() => router.push("/dashboard/student/research-paper")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Research Papers
      </Button>

      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {getStatusBadge(paper.status)}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Updated {formatDate(paper.updatedAt)}
                </div>
              </div>
              <CardTitle className="text-3xl mb-3">{paper.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              {paper.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/student/research-paper/${paper.id}/edit`)}
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
                      This action cannot be undone. This will permanently delete your research paper.
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
          {/* Abstract */}
          <Card>
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {paper.abstract || "No abstract provided"}
              </p>
            </CardContent>
          </Card>

          {/* Keywords */}
          {paper.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {paper.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({paper.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paper.members.map((member) => (
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
          {/* Reviewer */}
          {paper.reviewedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reviewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={paper.reviewedBy.user.image} />
                    <AvatarFallback>{getInitials(paper.reviewedBy.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{paper.reviewedBy.user.name}</div>
                    <div className="text-sm text-muted-foreground">{paper.reviewedBy.user.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(paper.documentUrl || paper.imageUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paper.documentUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(paper.documentUrl, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Research Paper Document
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                )}
                {paper.imageUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(paper.imageUrl, "_blank")}
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
                <div>{formatDate(paper.createdAt)}</div>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground mb-1">Last Updated</div>
                <div>{formatDate(paper.updatedAt)}</div>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground mb-1">Submitted By</div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={paper.student.user.image} />
                    <AvatarFallback className="text-xs">
                      {getInitials(paper.student.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{paper.student.user.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
