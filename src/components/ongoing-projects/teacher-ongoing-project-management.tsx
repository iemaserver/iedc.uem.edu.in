"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FolderOpen, 
  User, 
  Calendar,
  Download,
  Eye,
  MessageSquare,
  PlayCircle,
  StopCircle,
  Loader2
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface OngoingProject {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  status: string;
  startDate: string;
  endDate?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  student: {
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  facultyAdvisors: Array<{
    id: string;
    fullName: string;
  }>;
  members: Array<{
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TeacherOngoingProjectManagement() {
  const [ongoingProjects, setOngoingProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    project: OngoingProject | null;
    status: string;
    comment: string;
    loading: boolean;
  }>({
    open: false,
    project: null,
    status: "",
    comment: "",
    loading: false,
  });

  // Bulk action dialog
  const [bulkDialog, setBulkDialog] = useState<{
    open: boolean;
    status: string;
    comment: string;
    loading: boolean;
  }>({
    open: false,
    status: "",
    comment: "",
    loading: false,
  });

  const fetchOngoingProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await axios.get(`/api/teacher/ongoing-project?${params}`);
      
      if (response.data.success) {
        setOngoingProjects(response.data.data.ongoingProjects);
        setPagination(response.data.data.pagination);
      } else {
        toast.error("Failed to fetch ongoing projects");
      }
    } catch (error) {
      console.error("Error fetching ongoing projects:", error);
      toast.error("Error loading ongoing projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoingProjects();
  }, [pagination.page, searchQuery, statusFilter]);

  const handleStatusUpdate = async (projectId: string, status: string, comment?: string) => {
    try {
      const response = await axios.patch("/api/teacher/ongoing-project", {
        id: projectId,
        status,
        reviewComment: comment,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchOngoingProjects();
        setReviewDialog({ open: false, project: null, status: "", comment: "", loading: false });
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating project status");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProjects.length === 0) {
      toast.error("Please select at least one ongoing project");
      return;
    }

    setBulkDialog(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.post("/api/teacher/ongoing-project", {
        ids: selectedProjects,
        status: bulkDialog.status,
        reviewComment: bulkDialog.comment,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedProjects([]);
        fetchOngoingProjects();
        setBulkDialog({ open: false, status: "", comment: "", loading: false });
      } else {
        toast.error("Failed to update ongoing projects");
      }
    } catch (error) {
      console.error("Error bulk updating:", error);
      toast.error("Error updating ongoing projects");
    } finally {
      setBulkDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ONGOING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <StopCircle className="h-4 w-4" />;
      case "ONGOING":
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(ongoingProjects.map(project => project.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ongoing Project Management</h1>
          <p className="text-gray-600 mt-1">Review and manage ongoing projects you're advising</p>
        </div>
        
        {selectedProjects.length > 0 && (
          <Dialog open={bulkDialog.open} onOpenChange={(open) => setBulkDialog(prev => ({ ...prev, open }))}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Bulk Action ({selectedProjects.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Update Ongoing Projects</DialogTitle>
                <DialogDescription>
                  Update status for {selectedProjects.length} selected ongoing projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-status">Status</Label>
                  <Select value={bulkDialog.status} onValueChange={(value) => setBulkDialog(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONGOING">Ongoing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ACCEPTED">Accept</SelectItem>
                      <SelectItem value="REJECTED">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bulk-comment">Review Comment (Optional)</Label>
                  <Textarea
                    id="bulk-comment"
                    value={bulkDialog.comment}
                    onChange={(e) => setBulkDialog(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Add a review comment..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkDialog({ open: false, status: "", comment: "", loading: false })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={!bulkDialog.status || bulkDialog.loading}
                >
                  {bulkDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, abstract, or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ongoing Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Ongoing Projects ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : ongoingProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No ongoing projects found</h3>
              <p className="mt-2 text-gray-500">No ongoing projects match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 p-4 border-b">
                <Checkbox
                  checked={selectedProjects.length === ongoingProjects.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All ({ongoingProjects.length})</Label>
              </div>

              {/* Projects List */}
              {ongoingProjects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">{project.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusIcon(project.status)}
                            {project.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Student Info & Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {project.student.user.fullName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started: {formatDate(project.startDate)}
                        </div>
                        {project.endDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            End: {formatDate(project.endDate)}
                          </div>
                        )}
                      </div>

                      {/* Abstract */}
                      {project.abstract && (
                        <p className="text-sm text-gray-600 line-clamp-2">{project.abstract}</p>
                      )}

                      {/* Keywords */}
                      {project.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.keywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {project.keywords.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.keywords.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Review Comment */}
                      {project.reviewComment && (
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <MessageSquare className="h-4 w-4" />
                            Review Comment
                          </div>
                          <p className="text-sm text-gray-600">{project.reviewComment}</p>
                          {project.reviewedBy && project.reviewedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              By {project.reviewedBy} on {formatDate(project.reviewedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {project.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                        
                        <Dialog 
                          open={reviewDialog.open && reviewDialog.project?.id === project.id} 
                          onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, open, project: open ? project : null }))}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Ongoing Project</DialogTitle>
                              <DialogDescription>{project.title}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="review-status">Decision</Label>
                                <Select 
                                  value={reviewDialog.status} 
                                  onValueChange={(value) => setReviewDialog(prev => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select decision" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="ACCEPTED">Accept</SelectItem>
                                    <SelectItem value="REJECTED">Reject</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="review-comment">Review Comment</Label>
                                <Textarea
                                  id="review-comment"
                                  value={reviewDialog.comment}
                                  onChange={(e) => setReviewDialog(prev => ({ ...prev, comment: e.target.value }))}
                                  placeholder="Provide feedback to the student..."
                                  rows={4}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReviewDialog({ open: false, project: null, status: "", comment: "", loading: false })}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(project.id, reviewDialog.status, reviewDialog.comment)}
                                disabled={!reviewDialog.status}
                              >
                                Submit Review
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}