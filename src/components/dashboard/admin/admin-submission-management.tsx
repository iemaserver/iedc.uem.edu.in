"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResearchPaperStatus, OngoingProjectStatus, ProjectType, UserType } from "@prisma/client";
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
  UserPlus,
  Settings,
  Trash2,
  Edit
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";
import { MultiSelect } from "@/components/ui/multi-select-new";

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

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  teacherProfile?: {
    designation: string;
    affiliation: string;
  };
}

export function AdminSubmissionManagement() {
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [ongoingProjects, setOngoingProjects] = useState<OngoingProject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ResearchPaperStatus | OngoingProjectStatus>();
  const [activeTab, setActiveTab] = useState("research-papers");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [papersRes, projectsRes, teachersRes] = await Promise.all([
        axios.get("/api/admin/research-paper"),
        axios.get("/api/admin/ongoing-projects"),
        axios.get("/api/general/users", { params: { userType: "TEACHER" } })
      ]);

      if (papersRes.data?.data) {
        setResearchPapers(papersRes.data.data);
      }

      if (projectsRes.data?.data) {
        setOngoingProjects(projectsRes.data.data);
      }

      if (teachersRes.data?.data) {
        setTeachers(teachersRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
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

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;

    setIsUpdating(true);
    try {
      const ids = activeTab === "research-papers" ? selectedPapers : selectedProjects;
      const endpoint = activeTab === "research-papers" 
        ? "/api/admin/research-paper/bulk-actions"
        : "/api/admin/ongoing-projects/bulk-actions";

      await axios.patch(endpoint, {
        ids,
        status: bulkStatus
      });

      toast.success(`Successfully updated ${ids.length} items`);
      fetchData();
      setSelectedPapers([]);
      setSelectedProjects([]);
      setShowBulkStatusDialog(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAssignAdvisors = async () => {
    if (selectedAdvisors.length === 0) return;

    setIsUpdating(true);
    try {
      const ids = activeTab === "research-papers" ? selectedPapers : selectedProjects;
      const endpoint = activeTab === "research-papers" 
        ? "/api/admin/research-paper/bulk-actions"
        : "/api/admin/ongoing-projects/bulk-actions";

      const payload = activeTab === "research-papers" 
        ? { paperIds: ids, advisorIds: selectedAdvisors }
        : { projectIds: ids, advisorIds: selectedAdvisors };

      await axios.post(endpoint, payload);

      toast.success(`Successfully assigned advisors to ${ids.length} items`);
      fetchData();
      setSelectedPapers([]);
      setSelectedProjects([]);
      setSelectedAdvisors([]);
      setShowBulkAssignDialog(false);
    } catch (error: any) {
      console.error("Error assigning advisors:", error);
      toast.error(error.response?.data?.message || "Failed to assign advisors");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    if (activeTab === "research-papers") {
      setSelectedPapers(prev => 
        isSelected 
          ? [...prev, itemId]
          : prev.filter(id => id !== itemId)
      );
    } else {
      setSelectedProjects(prev => 
        isSelected 
          ? [...prev, itemId]
          : prev.filter(id => id !== itemId)
      );
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (activeTab === "research-papers") {
      setSelectedPapers(isSelected ? filteredPapers.map(p => p.id) : []);
    } else {
      setSelectedProjects(isSelected ? filteredProjects.map(p => p.id) : []);
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

  const selectedItems = activeTab === "research-papers" ? selectedPapers : selectedProjects;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Submission Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
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

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkStatusDialog(true)}
              >
                Update Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkAssignDialog(true)}
              >
                Assign Advisors
              </Button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="research-papers">
                Research Papers ({filteredPapers.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing-projects">
                Ongoing Projects ({filteredProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="research-papers" className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPapers.length === filteredPapers.length && filteredPapers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select All</span>
              </div>

              {filteredPapers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No research papers found
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedPapers.includes(paper.id)}
                          onCheckedChange={(checked) => handleItemSelection(paper.id, checked as boolean)}
                        />
                        
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="ongoing-projects" className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select All</span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No ongoing projects found
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => handleItemSelection(project.id, checked as boolean)}
                        />
                        
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
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

      {/* Bulk Status Update Dialog */}
      <AlertDialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the status for {selectedItems.length} selected {activeTab === "research-papers" ? "research papers" : "ongoing projects"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as ResearchPaperStatus | OngoingProjectStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {activeTab === "research-papers" ? (
                  <>
                    <SelectItem value={ResearchPaperStatus.UPLOADED}>Uploaded</SelectItem>
                    <SelectItem value={ResearchPaperStatus.UNDER_REVIEW}>Under Review</SelectItem>
                    <SelectItem value={ResearchPaperStatus.ACCEPTED}>Accepted</SelectItem>
                    <SelectItem value={ResearchPaperStatus.REJECTED}>Rejected</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value={OngoingProjectStatus.ONGOING}>Ongoing</SelectItem>
                    <SelectItem value={OngoingProjectStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={OngoingProjectStatus.ACCEPTED}>Accepted</SelectItem>
                    <SelectItem value={OngoingProjectStatus.REJECTED}>Rejected</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusUpdate} disabled={!bulkStatus || isUpdating}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Assign Advisors Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Faculty Advisors</DialogTitle>
            <DialogDescription>
              Assign faculty advisors to {selectedItems.length} selected {activeTab === "research-papers" ? "research papers" : "ongoing projects"}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <MultiSelect
              options={teachers.map(teacher => ({
                label: `${teacher.fullName} (${teacher.teacherProfile?.designation || 'Teacher'})`,
                value: teacher.id
              }))}
              onValueChange={setSelectedAdvisors}
              defaultValue={selectedAdvisors}
              placeholder="Select faculty advisors"
              variant="default"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignAdvisors} disabled={selectedAdvisors.length === 0 || isUpdating}>
              Assign Advisors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}