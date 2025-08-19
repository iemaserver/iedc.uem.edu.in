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
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Users, FileText, Eye, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { OngoingProjectStatus } from "@prisma/client";

interface OngoingProject {
  id: string;
  title: string;
  abstract?: string;
  status: OngoingProjectStatus;
  startDate?: string;
  endDate?: string;
  keywords: string[];
  image?: string;
  filepath?: string;
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

interface OngoingProjectManagementProps {
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
  userId: string;
}

export function OngoingProjectManagement({ userRole, userId }: OngoingProjectManagementProps) {
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<OngoingProject | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OngoingProjectStatus | "ALL">("ALL");

  useEffect(() => {
    fetchProjects();
  }, [userRole]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (userRole === "ADMIN") {
        endpoint = "/api/admin/ongoing-projects";
      } else if (userRole === "TEACHER") {
        // For teachers, get projects where they are faculty advisors
        endpoint = "/api/teacher/ongoing-projects";
      } else {
        // For students, get their own projects
        endpoint = "/api/student/ongoing-projects";
      }

      const response = await axios.get(endpoint);
      setProjects(response.data.data || []);
    } catch (error) {
      console.error("Error fetching ongoing projects:", error);
      toast.error("Failed to load ongoing projects");
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: OngoingProjectStatus) => {
    setIsUpdating(true);
    try {
      const endpoint = userRole === "ADMIN" 
        ? `/api/admin/ongoing-projects/${projectId}`
        : userRole === "TEACHER"
        ? `/api/teacher/ongoing-projects/${projectId}`
        : `/api/student/ongoing-projects/${projectId}`;

      await axios.put(endpoint, {
        status: newStatus,
        comment: statusComment
      });

      toast.success("Project status updated successfully");
      fetchProjects();
      setSelectedProject(null);
      setStatusComment("");
    } catch (error: any) {
      console.error("Error updating project status:", error);
      toast.error(error.response?.data?.message || "Failed to update project status");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const endpoint = userRole === "ADMIN" 
        ? `/api/admin/ongoing-projects/${projectId}`
        : `/api/student/ongoing-projects/${projectId}`;

      await axios.delete(endpoint);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  const getStatusColor = (status: OngoingProjectStatus) => {
    switch (status) {
      case "ONGOING": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "ACCEPTED": return "bg-emerald-100 text-emerald-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canUpdateStatus = userRole === "ADMIN" || userRole === "TEACHER";
  const canDelete = userRole === "ADMIN" || (userRole === "STUDENT" && projects.some(p => p.student.id === userId));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects by title or student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OngoingProjectStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Student: {project.student.user.fullName}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {project.abstract && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {project.abstract}
                </p>
              )}

              {/* Project Details */}
              <div className="space-y-2 text-sm text-gray-600">
                {project.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {project.endDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ends: {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                )}

                {project.facultyAdvisors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{project.facultyAdvisors.length} Faculty Advisor(s)</span>
                  </div>
                )}

                {project.members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{project.members.length} Member(s)</span>
                  </div>
                )}
              </div>

              {/* Keywords */}
              {project.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.keywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {project.keywords.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{project.keywords.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {/* View Details */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{project.title}</DialogTitle>
                      <DialogDescription>
                        Complete project details and collaboration information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Student</h4>
                        <p>{project.student.user.fullName} ({project.student.user.email})</p>
                      </div>

                      {project.abstract && (
                        <div>
                          <h4 className="font-semibold mb-2">Abstract</h4>
                          <p className="text-sm text-gray-600">{project.abstract}</p>
                        </div>
                      )}

                      {project.facultyAdvisors.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Faculty Advisors</h4>
                          <ul className="text-sm space-y-1">
                            {project.facultyAdvisors.map((advisor) => (
                              <li key={advisor.id}>
                                {advisor.fullName} ({advisor.email})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {project.members.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Project Members</h4>
                          <ul className="text-sm space-y-1">
                            {project.members.map((member) => (
                              <li key={member.id}>
                                {member.fullName} ({member.email})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {project.keywords.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {project.startDate && (
                          <div>
                            <h4 className="font-semibold">Start Date</h4>
                            <p>{new Date(project.startDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.endDate && (
                          <div>
                            <h4 className="font-semibold">End Date</h4>
                            <p>{new Date(project.endDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Update Status (for teachers and admin) */}
                {canUpdateStatus && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedProject(project)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Project Status</DialogTitle>
                        <DialogDescription>
                          Change the status of "{project.title}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Current Status</Label>
                          <p className="text-sm text-gray-600">{project.status}</p>
                        </div>
                        
                        <div>
                          <Label>New Status</Label>
                          <Select onValueChange={(value) => updateProjectStatus(project.id, value as OngoingProjectStatus)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ONGOING">Ongoing</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="ACCEPTED">Accepted</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Comments (Optional)</Label>
                          <Textarea
                            value={statusComment}
                            onChange={(e) => setStatusComment(e.target.value)}
                            placeholder="Add any comments about this status change..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Delete (for admin and students with their own projects) */}
                {(userRole === "ADMIN" || (userRole === "STUDENT" && project.student.id === userId)) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the project
                          "{project.title}" and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== "ALL" 
              ? "No projects match your current filters."
              : "No ongoing projects have been uploaded yet."
            }
          </p>
          {searchTerm || statusFilter !== "ALL" ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
