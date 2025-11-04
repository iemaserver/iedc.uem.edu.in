"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  Download,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface ResearchPaper {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  projectType: string;
  status: string;
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

export default function TeacherResearchPaperManagement() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
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
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    paper: ResearchPaper | null;
    status: string;
    comment: string;
    loading: boolean;
  }>({
    open: false,
    paper: null,
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

  const fetchResearchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await axios.get(`/api/teacher/research-paper?${params}`);
      
      if (response.data.success) {
        setResearchPapers(response.data.data.researchPapers);
        setPagination(response.data.data.pagination);
      } else {
        toast.error("Failed to fetch research papers");
      }
    } catch (error) {
      console.error("Error fetching research papers:", error);
      toast.error("Error loading research papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchPapers();
  }, [pagination.page, searchQuery, statusFilter]);

  const handleStatusUpdate = async (paperId: string, status: string, comment?: string) => {
    try {
      const response = await axios.patch("/api/teacher/research-paper", {
        id: paperId,
        status,
        reviewComment: comment,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchResearchPapers();
        setReviewDialog({ open: false, paper: null, status: "", comment: "", loading: false });
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating research paper status");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedPapers.length === 0) {
      toast.error("Please select at least one research paper");
      return;
    }

    setBulkDialog(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.post("/api/teacher/research-paper", {
        ids: selectedPapers,
        status: bulkDialog.status,
        reviewComment: bulkDialog.comment,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedPapers([]);
        fetchResearchPapers();
        setBulkDialog({ open: false, status: "", comment: "", loading: false });
      } else {
        toast.error("Failed to update research papers");
      }
    } catch (error) {
      console.error("Error bulk updating:", error);
      toast.error("Error updating research papers");
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
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "UPLOADED":
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
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPapers(researchPapers.map(paper => paper.id));
    } else {
      setSelectedPapers([]);
    }
  };

  const handleSelectPaper = (paperId: string, checked: boolean) => {
    if (checked) {
      setSelectedPapers(prev => [...prev, paperId]);
    } else {
      setSelectedPapers(prev => prev.filter(id => id !== paperId));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Paper Management</h1>
          <p className="text-gray-600 mt-1">Review and manage research papers you're advising</p>
        </div>
        
        {selectedPapers.length > 0 && (
          <Dialog open={bulkDialog.open} onOpenChange={(open) => setBulkDialog(prev => ({ ...prev, open }))}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Bulk Action ({selectedPapers.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Update Research Papers</DialogTitle>
                <DialogDescription>
                  Update status for {selectedPapers.length} selected research papers
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
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
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
                <SelectItem value="UPLOADED">Uploaded</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Research Papers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Research Papers ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : researchPapers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No research papers found</h3>
              <p className="mt-2 text-gray-500">No research papers match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 p-4 border-b">
                <Checkbox
                  checked={selectedPapers.length === researchPapers.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All ({researchPapers.length})</Label>
              </div>

              {/* Papers List */}
              {researchPapers.map((paper) => (
                <div key={paper.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedPapers.includes(paper.id)}
                      onCheckedChange={(checked) => handleSelectPaper(paper.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">{paper.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(paper.status)}>
                            {getStatusIcon(paper.status)}
                            {paper.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{paper.projectType}</Badge>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {paper.student.user.fullName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(paper.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Abstract */}
                      {paper.abstract && (
                        <p className="text-sm text-gray-600 line-clamp-2">{paper.abstract}</p>
                      )}

                      {/* Keywords */}
                      {paper.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {paper.keywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {paper.keywords.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{paper.keywords.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Review Comment */}
                      {paper.reviewComment && (
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <MessageSquare className="h-4 w-4" />
                            Review Comment
                          </div>
                          <p className="text-sm text-gray-600">{paper.reviewComment}</p>
                          {paper.reviewedBy && paper.reviewedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              By {paper.reviewedBy} on {new Date(paper.reviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {paper.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                        
                        <Dialog 
                          open={reviewDialog.open && reviewDialog.paper?.id === paper.id} 
                          onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, open, paper: open ? paper : null }))}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Research Paper</DialogTitle>
                              <DialogDescription>{paper.title}</DialogDescription>
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
                                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
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
                                onClick={() => setReviewDialog({ open: false, paper: null, status: "", comment: "", loading: false })}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(paper.id, reviewDialog.status, reviewDialog.comment)}
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