"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { ResearchPaperStatus, OngoingProjectStatus, ProjectType } from "@prisma/client";
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  User,
  Calendar,
  ExternalLink,
  UserPlus
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

interface OngoingProject {
  id: string;
  title: string;
  abstract?: string;
  status: OngoingProjectStatus;
  keywords: string[];
  image?: string;
  filepath?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
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

export function TeacherSubmissionReviewDashboard() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [ongoingProjects, setOngoingProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<ResearchPaper | OngoingProject | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [papersRes, projectsRes] = await Promise.all([
        axios.get("/api/teacher/research-paper"),
        axios.get("/api/teacher/ongoing-projects")
      ]);

      if (papersRes.data?.data) {
        setResearchPapers(papersRes.data.data);
      }

      if (projectsRes.data?.data) {
        setOngoingProjects(projectsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ResearchPaperStatus | OngoingProjectStatus) => {
    switch (status) {
      case ResearchPaperStatus.UPLOADED:
      case OngoingProjectStatus.ONGOING:
        return <Clock className="h-4 w-4" />;
      case ResearchPaperStatus.UNDER_REVIEW:
        return <Eye className="h-4 w-4" />;
      case ResearchPaperStatus.ACCEPTED:
      case OngoingProjectStatus.ACCEPTED:
        return <CheckCircle className="h-4 w-4" />;
      case ResearchPaperStatus.REJECTED:
      case OngoingProjectStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case OngoingProjectStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ResearchPaperStatus | OngoingProjectStatus) => {
    switch (status) {
      case ResearchPaperStatus.UPLOADED:
      case OngoingProjectStatus.ONGOING:
        return "bg-blue-100 text-blue-800";
      case ResearchPaperStatus.UNDER_REVIEW:
        return "bg-yellow-100 text-yellow-800";
      case ResearchPaperStatus.ACCEPTED:
      case OngoingProjectStatus.ACCEPTED:
      case OngoingProjectStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case ResearchPaperStatus.REJECTED:
      case OngoingProjectStatus.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAcceptAdvisorship = async (itemId: string, type: "paper" | "project") => {
    setIsUpdating(true);
    try {
      const endpoint = type === "paper" 
        ? "/api/teacher/research-paper/accept-advisorship"
        : "/api/teacher/ongoing-projects/accept-advisorship";
      
      const payload = type === "paper" 
        ? { paperId: itemId }
        : { projectId: itemId };

      await axios.post(endpoint, payload);
      
      toast.success(`Successfully accepted as faculty advisor for ${type}`);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error accepting advisorship:", error);
      toast.error(error.response?.data?.message || "Failed to accept advisorship");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (itemId: string, status: ResearchPaperStatus | OngoingProjectStatus, type: "paper" | "project") => {
    setIsUpdating(true);
    try {
      const endpoint = type === "paper" 
        ? `/api/teacher/research-paper/${itemId}`
        : `/api/teacher/ongoing-projects/${itemId}`;

      await axios.put(endpoint, { status });
      
      toast.success(`${type === "paper" ? "Research paper" : "Ongoing project"} status updated successfully`);
      fetchData(); // Refresh data
      setSelectedItem(null);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPapers = researchPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || paper.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProjects = ongoingProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isUserAdvisor = (advisors: Array<{id: string}>, userId?: string) => {
    return advisors.some(advisor => advisor.id === userId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading submissions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Review Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={ResearchPaperStatus.UPLOADED}>Uploaded</SelectItem>
                <SelectItem value={ResearchPaperStatus.UNDER_REVIEW}>Under Review</SelectItem>
                <SelectItem value={ResearchPaperStatus.ACCEPTED}>Accepted</SelectItem>
                <SelectItem value={ResearchPaperStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="research-papers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="research-papers">
                Research Papers ({filteredPapers.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing-projects">
                Ongoing Projects ({filteredProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="research-papers" className="space-y-4">
              {filteredPapers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No research papers found
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{paper.title}</h3>
                            <Badge className={getStatusColor(paper.status)}>
                              {getStatusIcon(paper.status)}
                              <span className="ml-1">{paper.status}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {paper.student.user.fullName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(paper.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>

                          {paper.abstract && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {paper.abstract}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Faculty Advisors:</span>
                            {paper.facultyAdvisors.length > 0 ? (
                              paper.facultyAdvisors.map((advisor) => (
                                <Badge key={advisor.id} variant="secondary" className="text-xs">
                                  {advisor.fullName}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">No advisors assigned</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(paper)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{paper.title}</DialogTitle>
                                <DialogDescription>
                                  Submitted by {paper.student.user.fullName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {paper.abstract && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Abstract</h4>
                                    <p className="text-gray-600">{paper.abstract}</p>
                                  </div>
                                )}
                                
                                {paper.keywords.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Keywords</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {paper.keywords.map((keyword) => (
                                        <Badge key={keyword} variant="secondary">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {paper.fileUrl && (
                                  <div>
                                    <Button
                                      variant="outline"
                                      onClick={() => window.open(paper.fileUrl, "_blank")}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Document
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <DialogFooter className="flex justify-between">
                                {!isUserAdvisor(paper.facultyAdvisors) && (
                                  <Button
                                    onClick={() => handleAcceptAdvisorship(paper.id, "paper")}
                                    disabled={isUpdating}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Accept as Advisor
                                  </Button>
                                )}
                                {isUserAdvisor(paper.facultyAdvisors) && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="text-green-600"
                                      onClick={() => handleStatusUpdate(paper.id, ResearchPaperStatus.ACCEPTED, "paper")}
                                      disabled={isUpdating}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="text-red-600"
                                      onClick={() => handleStatusUpdate(paper.id, ResearchPaperStatus.REJECTED, "paper")}
                                      disabled={isUpdating}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="ongoing-projects" className="space-y-4">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No ongoing projects found
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1">{project.status}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {project.student.user.fullName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(project.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>

                          {project.abstract && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {project.abstract}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Faculty Advisors:</span>
                            {project.facultyAdvisors.length > 0 ? (
                              project.facultyAdvisors.map((advisor) => (
                                <Badge key={advisor.id} variant="secondary" className="text-xs">
                                  {advisor.fullName}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">No advisors assigned</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(project)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{project.title}</DialogTitle>
                                <DialogDescription>
                                  Submitted by {project.student.user.fullName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {project.abstract && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Abstract</h4>
                                    <p className="text-gray-600">{project.abstract}</p>
                                  </div>
                                )}
                                
                                {project.keywords.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Keywords</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {project.keywords.map((keyword) => (
                                        <Badge key={keyword} variant="secondary">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  {project.startDate && (
                                    <div>
                                      <h4 className="font-semibold mb-1">Start Date</h4>
                                      <p className="text-gray-600">
                                        {format(new Date(project.startDate), "MMM dd, yyyy")}
                                      </p>
                                    </div>
                                  )}
                                  {project.endDate && (
                                    <div>
                                      <h4 className="font-semibold mb-1">End Date</h4>
                                      <p className="text-gray-600">
                                        {format(new Date(project.endDate), "MMM dd, yyyy")}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {project.filepath && (
                                  <div>
                                    <Button
                                      variant="outline"
                                      onClick={() => window.open(project.filepath, "_blank")}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Project Files
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <DialogFooter className="flex justify-between">
                                {!isUserAdvisor(project.facultyAdvisors) && (
                                  <Button
                                    onClick={() => handleAcceptAdvisorship(project.id, "project")}
                                    disabled={isUpdating}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Accept as Advisor
                                  </Button>
                                )}
                                {isUserAdvisor(project.facultyAdvisors) && project.status === OngoingProjectStatus.ONGOING && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="text-green-600"
                                      onClick={() => handleStatusUpdate(project.id, OngoingProjectStatus.ACCEPTED, "project")}
                                      disabled={isUpdating}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="text-red-600"
                                      onClick={() => handleStatusUpdate(project.id, OngoingProjectStatus.REJECTED, "project")}
                                      disabled={isUpdating}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}