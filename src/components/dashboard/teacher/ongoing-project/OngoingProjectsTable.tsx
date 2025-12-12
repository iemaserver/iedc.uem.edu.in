"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Trash2, Eye, Github, Send, CheckCircle, XCircle, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, Trash, FolderGit2, User, Users, FileText } from "lucide-react";
import { TablePagination } from "../../TablePagination";

import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import axios from "axios";

export function OngoingProjectsTable({projects}: {projects: any[]}) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isTeacher = session?.user?.role === "TEACHER";
  const isStudent = session?.user?.role === "STUDENT";

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/ongoing-project/${deleteId}`);
      toast.success("Project deleted successfully");
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => axios.delete(`/api/ongoing-project/${id}`)));
      toast.success(`${selectedIds.length} projects deleted successfully`);
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete projects");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.put(`/api/ongoing-project/${id}`, { status: newStatus });
      toast.success(`Project ${newStatus.toLowerCase().replace("_", " ")}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  const handleSubmit = async (id: string) => {
    handleStatusChange(id, "UNDER_REVIEW");
  };

  const toggleSelectAll = () => {
    const allPageIds = paginatedProjects.map((p) => p.id);
    const allSelected = allPageIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const selectAllPages = () => {
    setSelectedIds(filteredAndSortedProjects.map((p) => p.id));
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));
    return [
      { value: "all", label: "All Statuses" },
      ...statuses.map(s => ({ value: s, label: s }))
    ];
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesSearch = !searchQuery || 
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.keywords?.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "createdAt" || sortField === "updatedAt" || sortField === "startDate" || sortField === "expectedEndDate") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (sortField === "members" || sortField === "advisors") {
        aVal = a[sortField]?.length || 0;
        bVal = b[sortField]?.length || 0;
      } else {
        aVal = aVal?.toString().toLowerCase() || "";
        bVal = bVal?.toString().toLowerCase() || "";
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [projects, statusFilter, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage, itemsPerPage]);

  useEffect(() => { 
    setCurrentPage(1);
    setSelectedIds([]);
  }, [statusFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [sortField, sortOrder, itemsPerPage]);
   
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      DRAFT: { 
        icon: FileText, 
        label: "Draft", 
        bgColor: 'var(--forth-color)',
        textColor: 'var(--first-color)',
        borderColor: 'var(--third-color)'
      },
      UNDER_REVIEW: { 
        icon: Eye, 
        label: "Under Review", 
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        borderColor: '#FCD34D'
      },
      APPROVED: { 
        icon: CheckCircle, 
        label: "Approved", 
        bgColor: '#D1FAE5',
        textColor: '#065F46',
        borderColor: '#34D399'
      },
      REJECTED: { 
        icon: XCircle, 
        label: "Rejected", 
        bgColor: '#FEE2E2',
        textColor: '#991B1B',
        borderColor: '#F87171'
      },
      PUBLISHED: { 
        icon: CheckCircle, 
        label: "Published", 
        bgColor: 'var(--second-color)',
        textColor: 'white',
        borderColor: 'var(--first-color)'
      },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const StatusIcon = config.icon;

    return (
      <Badge 
        variant="outline" 
        className="font-semibold border"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          borderColor: config.borderColor
        }}
      >
        <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
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

  const handleViewProject = (projectId: string) => {
    router.push(`/dashboard/faculty/project/${projectId}`);
  };

  

  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold" style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Ongoing Projects
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Track and manage student ongoing projects
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {selectedIds.length > 0 && (
                <Button 
                  onClick={() => setIsMultiDeleteOpen(true)} 
                  variant="destructive" 
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Trash className="h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
             
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, student, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border-2" style={{ borderColor: 'var(--third-color)', backgroundColor: 'var(--forth-color)' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="text-sm font-semibold px-3 py-1" style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))', color: 'white' }}>
                  {selectedIds.length} Selected
                </Badge>
                {selectedIds.length < filteredAndSortedProjects.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPages}
                    className="text-xs"
                  >
                    Select All {filteredAndSortedProjects.length} Projects
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSelections}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsMultiDeleteOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto custom-scrollbar" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--second-color) var(--forth-color)'
          }}>
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: var(--forth-color);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(to right, var(--first-color), var(--second-color));
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to right, var(--second-color), var(--third-color));
              }
            `}</style>
            <Table className="min-w-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20">
                    <Checkbox
                      checked={paginatedProjects.length > 0 && paginatedProjects.every(p => selectedIds.includes(p.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("title")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Title
                      {sortField === "title" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "title" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("status")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Status
                      {sortField === "status" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "status" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Keywords</TableHead>
                  <TableHead className="min-w-[150px]">Student</TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("advisors")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Advisors
                      {sortField === "advisors" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "advisors" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("members")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Members
                      {sortField === "members" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "members" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("createdAt")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Created
                      {sortField === "createdAt" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "createdAt" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("updatedAt")} 
                      className="h-8 px-2 hover:bg-muted/50 text-xs sm:text-sm"
                    >
                      Updated
                      {sortField === "updatedAt" && (
                        sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )
                      )}
                      {sortField !== "updatedAt" && (
                        <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery || statusFilter !== "all" 
                        ? "No projects found. Try adjusting your search or filters."
                        : "No ongoing projects found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()} >
                        <Checkbox
                          checked={selectedIds.includes(project.id)}
                          onCheckedChange={() => toggleSelectOne(project.id)}
                          aria-label={`Select ${project.title}`}
                          className="bg-red-300"
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium max-w-sm cursor-pointer"
                        onClick={() => handleViewProject(project.id)}
                      >
                        <div className="flex items-start gap-2">
                          <FolderGit2
                            className="h-4 w-4 mt-1 flex-shrink-0"
                            style={{ color: "var(--second-color)" }}
                          />
                          <span className="line-clamp-2">{project.title.length > 30 ? project.title.substring(0, 30) + "..." : project.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {project.keywords && project.keywords.length > 0 ? (
                            <>
                              {project.keywords.slice(0, 2).map((keyword: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: "var(--forth-color)",
                                    color: "var(--first-color)",
                                  }}
                                >
                                  {keyword}
                                </Badge>
                              ))}
                              {project.keywords.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.keywords.length - 2}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No keywords</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(to bottom right, var(--second-color), var(--third-color))",
                            }}
                          >
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm truncate max-w-[100px]">
                            {project.student?.user?.name || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex -space-x-2">
                            {project.advisors?.slice(0, 3).map((advisor: any) => (
                              <Tooltip key={advisor.id}>
                                <TooltipTrigger>
                                  <Avatar className="w-8 h-8 border-2 border-background">
                                    <AvatarImage src={advisor.advisor?.image} />
                                    <AvatarFallback>
                                      {advisor.advisor?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {advisor.advisor?.name || "Unknown"}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {project.advisors && project.advisors.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{project.advisors.length - 3}
                              </div>
                            )}
                            {(!project.advisors || project.advisors.length === 0) && (
                              <span className="text-xs text-muted-foreground">No advisors</span>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex -space-x-2">
                            {project.members?.slice(0, 3).map((member: any) => (
                              <Tooltip key={member.id}>
                                <TooltipTrigger>
                                  <Avatar className="w-8 h-8 border-2 border-background">
                                    <AvatarImage src={member.member?.image} />
                                    <AvatarFallback>
                                      {member.member?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {member.member?.name || "Unknown"} {member.role && `(${member.role})`}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {project.members && project.members.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{project.members.length - 3}
                              </div>
                            )}
                            {(!project.members || project.members.length === 0) && (
                              <span className="text-xs text-muted-foreground">No members</span>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleViewProject(project.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {project.repositoryUrl && (
                              <DropdownMenuItem
                                onClick={() => window.open(project.repositoryUrl, "_blank")}
                              >
                                <Github className="h-4 w-4 mr-2" />
                                View Repository
                              </DropdownMenuItem>
                            )}
                            {project.documentUrl && (
                              <DropdownMenuItem
                                onClick={() => window.open(project.documentUrl, "_blank")}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Document
                              </DropdownMenuItem>
                            )}
                            
                            {isStudent && project.student.userId === session?.user?.id && (
                              <>
                                {project.status === "DRAFT" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleSubmit(project.id)}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Submit for Review
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}

                            {isTeacher && project.advisors?.some((a: any) => a.advisorId === session?.user?.id) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
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
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setDeleteId(project.id); setIsDeleteOpen(true); }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 px-4 pb-4">
            <TablePagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              totalItems={filteredAndSortedProjects.length} 
              itemsPerPage={itemsPerPage} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Projects?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} project{selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedIds.length} Item{selectedIds.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
