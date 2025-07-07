"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Upload,
  Calendar,
  Users
} from "lucide-react";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

interface OngoingProject {
  id: string;
  title: string;
  description: string;
  status: string;
  reviewerStatus: string;
  projectType?: string;
  projectTags: string[];
  projectLink?: string;
  projectImage?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  facultyAdvisors: ProjectMember[];
  reviewer?: ProjectMember;
  reviewerComments?: string;
  needsUpdate: boolean;
  updateRequest?: string;
  updateDeadline?: string;
  studentUpdateComments?: string;
  studentUpdatedAt?: string;
}

const updateResponseSchema = z.object({
  studentUpdateComments: z.string().min(10, "Please provide a detailed response (at least 10 characters)"),
  projectLink: z.string().url().optional().or(z.literal("")),
  projectImage: z.string().url().optional().or(z.literal("")),
});

type UpdateResponseForm = z.infer<typeof updateResponseSchema>;

export default function StudentProjectManagement() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<OngoingProject | null>(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const form = useForm<UpdateResponseForm>({
    resolver: zodResolver(updateResponseSchema),
    defaultValues: {
      studentUpdateComments: "",
      projectLink: "",
      projectImage: "",
    },
  });

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get("/api/paper/ongoingProject", {
        params: {
          member: session.user.id,
          limit: 100,
        },
      });

      setProjects(response.data.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [session?.user?.id]);

  const handleUpdateResponse = async (data: UpdateResponseForm) => {
    if (!selectedProject || !session?.user?.id) return;

    setSubmittingUpdate(true);
    try {
      await axios.put(`/api/paper/ongoingProject/${selectedProject.id}`, {
        studentUpdateComments: data.studentUpdateComments,
        projectLink: data.projectLink || selectedProject.projectLink,
        projectImage: data.projectImage || selectedProject.projectImage,
        needsUpdate: false, // Mark as updated
        studentUpdatedAt: new Date().toISOString(),
      });

      toast.success("Update response submitted successfully");
      setSelectedProject(null);
      form.reset();
      fetchProjects();
    } catch (error) {
      console.error("Error submitting update response:", error);
      toast.error("Failed to submit update response");
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPLOAD: { variant: "secondary" as const, label: "Draft", icon: FileText },
      ONGOING: { variant: "default" as const, label: "In Progress", icon: Clock },
      COMPLETED: { variant: "default" as const, label: "Completed", icon: CheckCircle },
      PUBLISH: { variant: "default" as const, label: "Published", icon: CheckCircle },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled", icon: AlertCircle },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      variant: "secondary" as const, 
      label: status, 
      icon: FileText 
    };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getReviewerStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { variant: "outline" as const, label: "Pending Review", icon: Clock },
      ACCEPTED: { variant: "default" as const, label: "Approved", icon: CheckCircle },
      REJECTED: { variant: "destructive" as const, label: "Rejected", icon: AlertCircle },
      NEEDS_UPDATES: { variant: "secondary" as const, label: "Needs Updates", icon: MessageSquare },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      variant: "outline" as const, 
      label: status, 
      icon: Clock 
    };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const isUpdateRequired = (project: OngoingProject) => {
    return project.needsUpdate && project.updateRequest;
  };

  const isUpdateOverdue = (project: OngoingProject) => {
    if (!project.updateDeadline) return false;
    return new Date(project.updateDeadline) < new Date();
  };

  if (!session || session.user.userType !== "STUDENT") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Access denied. Student access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-gray-600">Manage your ongoing projects and respond to reviewer feedback</p>
        </div>
        <Button onClick={fetchProjects} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">You haven't submitted any projects yet.</p>
            <Button className="mt-4" onClick={() => window.location.href = "/dashboard/paper/project"}>
              Create New Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id} className={`${isUpdateRequired(project) ? 'border-orange-200 bg-orange-50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="max-w-2xl">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(project.status)}
                    {getReviewerStatusBadge(project.reviewerStatus)}
                  </div>
                </div>
                
                {isUpdateRequired(project) && (
                  <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        Reviewer has requested updates
                      </p>
                      {project.updateDeadline && (
                        <p className="text-xs text-orange-600">
                          Deadline: {new Date(project.updateDeadline).toLocaleDateString()}
                          {isUpdateOverdue(project) && (
                            <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedProject(project);
                            form.setValue("projectLink", project.projectLink || "");
                            form.setValue("projectImage", project.projectImage || "");
                          }}
                        >
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Respond to Reviewer Feedback</DialogTitle>
                          <DialogDescription>
                            Address the reviewer's comments and update your project as needed.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Reviewer's Update Request:</h4>
                            <p className="text-sm text-gray-700">{project.updateRequest}</p>
                            
                            {project.reviewerComments && (
                              <div className="mt-3 pt-3 border-t">
                                <h5 className="font-medium text-sm mb-1">Additional Comments:</h5>
                                <p className="text-sm text-gray-600">{project.reviewerComments}</p>
                              </div>
                            )}
                          </div>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleUpdateResponse)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="studentUpdateComments"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Response *</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Explain what changes you've made and how you've addressed the reviewer's feedback..."
                                        className="min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="projectLink"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Updated Project Link (optional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://github.com/yourusername/project"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="projectImage"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Updated Project Image URL (optional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com/updated-image.jpg"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setSelectedProject(null)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={submittingUpdate}>
                                  {submittingUpdate ? "Submitting..." : "Submit Response"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Team Members:</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      {project.members.map(member => member.name).join(", ")}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Start Date:</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {project.facultyAdvisors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Faculty Advisors:</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      {project.facultyAdvisors.map(advisor => advisor.name).join(", ")}
                    </div>
                  </div>
                )}
                
                {project.reviewer && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">Reviewer:</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      {project.reviewer.name}
                    </div>
                  </div>
                )}
                
                {project.projectTags.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {project.projectTags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.reviewerComments && !isUpdateRequired(project) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium mb-1 text-blue-800">Reviewer Comments:</h4>
                    <p className="text-sm text-blue-700">{project.reviewerComments}</p>
                  </div>
                )}
                
                {project.studentUpdateComments && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium mb-1 text-green-800">Your Last Update:</h4>
                    <p className="text-sm text-green-700">{project.studentUpdateComments}</p>
                    {project.studentUpdatedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Updated: {new Date(project.studentUpdatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {project.projectLink && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.projectLink} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Project
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/dashboard/paper/project?edit=${project.id}`}>
                      Edit Project
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
