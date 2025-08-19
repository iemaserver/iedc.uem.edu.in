"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { ResearchPaperStatus, ProjectType } from "@prisma/client";
import { 
  FileText, 
  Eye, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  User,
  Calendar,
  Tag,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";

interface ResearchPaper {
  id: string;
  title: string;
  abstract?: string;
  status: ResearchPaperStatus;
  projectType: ProjectType;
  keywords: string[];
  image?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
    rollNumber: string;
    department: string;
    year: number;
  };
  facultyAdvisors: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
}

interface ResearchPaperManagementProps {
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
  userId: string;
}

export function ResearchPaperManagement({ userRole, userId }: ResearchPaperManagementProps) {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusComment, setStatusComment] = useState("");

  useEffect(() => {
    fetchPapers();
  }, [userRole]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (userRole === "ADMIN") {
        endpoint = "/api/admin/research-paper";
      } else if (userRole === "TEACHER") {
        // For teachers, get papers where they are faculty advisors
        endpoint = "/api/teacher/research-paper";
      } else {
        // For students, get their own papers
        endpoint = "/api/student/research-paper";
      }

      const response = await axios.get(endpoint);
      setPapers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load research papers");
    } finally {
      setLoading(false);
    }
  };

  const updatePaperStatus = async (paperId: string, newStatus: ResearchPaperStatus) => {
    setIsUpdating(true);
    try {
      const endpoint = userRole === "ADMIN" 
        ? `/api/admin/research-paper/${paperId}`
        : userRole === "TEACHER"
        ? `/api/teacher/research-paper/${paperId}`
        : `/api/student/research-paper/${paperId}`;

      await axios.put(endpoint, {
        status: newStatus,
        comment: statusComment
      });

      toast.success(`Research paper ${newStatus.toLowerCase()} successfully!`);
      setStatusComment("");
      setSelectedPaper(null);
      fetchPapers(); // Refresh the list
    } catch (error: any) {
      console.error("Error updating paper status:", error);
      const message = error.response?.data?.message || "Failed to update paper status";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: ResearchPaperStatus) => {
    switch (status) {
      case ResearchPaperStatus.UPLOADED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case ResearchPaperStatus.UNDER_REVIEW:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case ResearchPaperStatus.ACCEPTED:
        return "bg-green-100 text-green-800 border-green-200";
      case ResearchPaperStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: ResearchPaperStatus) => {
    switch (status) {
      case ResearchPaperStatus.UPLOADED:
        return <Upload className="h-4 w-4" />;
      case ResearchPaperStatus.UNDER_REVIEW:
        return <Clock className="h-4 w-4" />;
      case ResearchPaperStatus.ACCEPTED:
        return <CheckCircle className="h-4 w-4" />;
      case ResearchPaperStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canUpdateStatus = (paper: ResearchPaper) => {
    // Published papers cannot be updated
    if (paper.status === ResearchPaperStatus.ACCEPTED) {
      return false;
    }
    
    // Admins can update any paper
    if (userRole === "ADMIN") {
      return true;
    }
    
    // Teachers can only update papers they are advisors for
    return paper.facultyAdvisors.some(advisor => advisor.id === userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading research papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Research Papers Management</h2>
        <div className="text-sm text-muted-foreground">
          {papers.length} paper(s) found
        </div>
      </div>

      {papers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Research Papers</h3>
            <p className="text-muted-foreground text-center">
              {userRole === "ADMIN" 
                ? "No research papers have been uploaded yet." 
                : "No research papers assigned to you as faculty advisor."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {papers.map((paper) => (
            <Card key={paper.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{paper.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {paper.student.user.fullName} ({paper.student.rollNumber})
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(paper.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`flex items-center gap-1 ${getStatusColor(paper.status)}`}
                      variant="outline"
                    >
                      {getStatusIcon(paper.status)}
                      {paper.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {paper.abstract && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {paper.abstract}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{paper.projectType}</Badge>
                  {paper.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {paper.facultyAdvisors.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Faculty Advisors:
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {paper.facultyAdvisors.map((advisor) => (
                        <Badge key={advisor.id} variant="outline" className="text-xs">
                          {advisor.fullName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {/* View Details */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{paper.title}</DialogTitle>
                          <DialogDescription>
                            Research paper details and information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Student</Label>
                            <p className="text-sm">
                              {paper.student.user.fullName} ({paper.student.rollNumber}) - 
                              {paper.student.department}, Year {paper.student.year}
                            </p>
                          </div>
                          {paper.abstract && (
                            <div>
                              <Label>Abstract</Label>
                              <p className="text-sm text-muted-foreground">{paper.abstract}</p>
                            </div>
                          )}
                          {paper.fileUrl && (
                            <div>
                              <Label>File</Label>
                              <Button asChild variant="outline" size="sm">
                                <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open File
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* File Link */}
                    {paper.fileUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          File
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Status Update Actions */}
                  {canUpdateStatus(paper) && (
                    <div className="flex gap-2">
                      {paper.status === ResearchPaperStatus.UPLOADED && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedPaper(paper)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Research Paper</DialogTitle>
                                <DialogDescription>
                                  Update the status of "{paper.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>New Status</Label>
                                  <Select
                                    onValueChange={(value) => {
                                      if (selectedPaper) {
                                        setSelectedPaper({
                                          ...selectedPaper,
                                          status: value as ResearchPaperStatus
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select new status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={ResearchPaperStatus.UNDER_REVIEW}>
                                        Under Review
                                      </SelectItem>
                                      <SelectItem value={ResearchPaperStatus.ACCEPTED}>
                                        Accept & Publish
                                      </SelectItem>
                                      <SelectItem value={ResearchPaperStatus.REJECTED}>
                                        Reject
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Comment (Optional)</Label>
                                  <Textarea
                                    value={statusComment}
                                    onChange={(e) => setStatusComment(e.target.value)}
                                    placeholder="Add a comment about your decision..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedPaper(null);
                                      setStatusComment("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (selectedPaper) {
                                        updatePaperStatus(selectedPaper.id, selectedPaper.status);
                                      }
                                    }}
                                    disabled={!selectedPaper || isUpdating}
                                  >
                                    {isUpdating ? "Updating..." : "Update Status"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {paper.status === ResearchPaperStatus.UNDER_REVIEW && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="default">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Accept & Publish Paper</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will publish the research paper "{paper.title}". 
                                  Once published, it cannot be modified. Are you sure?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updatePaperStatus(paper.id, ResearchPaperStatus.ACCEPTED)}
                                >
                                  Accept & Publish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Research Paper</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reject the research paper "{paper.title}". 
                                  The student will be notified. Are you sure?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updatePaperStatus(paper.id, ResearchPaperStatus.REJECTED)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
