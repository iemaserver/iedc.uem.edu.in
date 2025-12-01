"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, FolderGit2, Send, CheckCircle, XCircle, Github } from "lucide-react";

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
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  UNDER_REVIEW: "bg-blue-500",
  APPROVED: "bg-green-500",
  PUBLISHED: "bg-purple-500",
  REJECTED: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

export function OngoingProjectsTable() {
  const { data: session } = useSession();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const isTeacher = session?.user?.role === "TEACHER";
  const isStudent = session?.user?.role === "STUDENT";

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ongoing-project");
      if (response.ok) {
        const result = await response.json();
        setProjects(result.success ? result.data : result);
      } else {
        throw new Error("Failed to fetch projects");
      }
    } catch (error: any) {
     toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ongoing-project/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

        toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");

    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ongoing-project/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

        toast.success(`Project ${newStatus.toLowerCase().replace("_", " ")}`);

      fetchProjects();
    } catch (error: any) {
        toast.error(error.message || "An error occurred");
    }
  };

  const handleSubmit = async (id: string) => {
    handleStatusChange(id, "UNDER_REVIEW");
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ongoing Projects</h2>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Advisors</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No ongoing projects found.{" "}
                    {isStudent && "Click 'New Project' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="truncate">{project.title}</div>
                          {project.keywords && project.keywords.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {project.keywords.slice(0, 3).map((keyword: string) => (
                                <Badge key={keyword} variant="outline" className="text-xs">
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={project.student.user.image} />
                          <AvatarFallback>
                            {project.student.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{project.student.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex -space-x-2">
                          {project.advisors.slice(0, 3).map((advisor: any) => (
                            <Tooltip key={advisor.id}>
                              <TooltipTrigger>
                                <Avatar className="w-8 h-8 border-2 border-background">
                                  <AvatarImage src={advisor.advisor.image} />
                                  <AvatarFallback>
                                    {advisor.advisor.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {advisor.advisor.name}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {project.advisors.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                              +{project.advisors.length - 3}
                            </div>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((member: any) => (
                            <Tooltip key={member.id}>
                              <TooltipTrigger>
                                <Avatar className="w-8 h-8 border-2 border-background">
                                  <AvatarImage src={member.member.image} />
                                  <AvatarFallback>
                                    {member.member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {member.member.name} ({member.role})
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {project.members.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.startDate && (
                        <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                      )}
                      {project.expectedEndDate && (
                        <div>End: {new Date(project.expectedEndDate).toLocaleDateString()}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {project.repositoryUrl && (
                            <DropdownMenuItem
                              onClick={() => window.open(project.repositoryUrl, "_blank")}
                            >
                              <Github className="w-4 h-4 mr-2" />
                              View Repository
                            </DropdownMenuItem>
                          )}
                          {project.documentUrl && (
                            <DropdownMenuItem
                              onClick={() => window.open(project.documentUrl, "_blank")}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Document
                            </DropdownMenuItem>
                          )}
                          
                          {isStudent && project.student.userId === session?.user?.id && (
                            <>
                              {project.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => handleSubmit(project.id)}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit for Review
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingProjectId(project.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}

                          {isTeacher && project.advisors.some((a: any) => a.advisorId === session?.user?.id) && (
                            <>
                              {project.status === "UNDER_REVIEW" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(project.id, "APPROVED")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(project.id, "REJECTED")}
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {project.status === "APPROVED" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(project.id, "PUBLISHED")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!deletingProjectId}
        onOpenChange={() => setDeletingProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProjectId && handleDelete(deletingProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
