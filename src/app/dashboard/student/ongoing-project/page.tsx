"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FolderKanban,
  Plus,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  GitBranch,
  TrendingUp,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/dashboard/TablePagination";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Area, AreaChart, CartesianGrid, XAxis, Cell, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OngoingProject {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  status: string;
  documentUrl?: string;
  imageUrl?: string;
  repositoryUrl?: string;
  startDate?: string;
  expectedEndDate?: string;
  completedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  advisors: {
    advisor: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  members: {
    member: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }[];
}

type SortField = "title" | "status" | "startDate" | "expectedEndDate" | "updatedAt" | "members";
type SortOrder = "asc" | "desc";

interface Filters {
  status: string[];
  keywords: string[];
  hasAdvisor: string;
  startDateFrom: string;
  startDateTo: string;
  endDateFrom: string;
  endDateTo: string;
  membersMin: string;
  membersMax: string;
}

export default function OngoingProjectListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Multi-select
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  // Dialogs
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSingleProject, setDeletingSingleProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<OngoingProject | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    status: [],
    keywords: [],
    hasAdvisor: "all",
    startDateFrom: "",
    startDateTo: "",
    endDateFrom: "",
    endDateTo: "",
    membersMin: "",
    membersMax: "",
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    repositoryUrl: "",
    documentUrl: "",
    imageUrl: "",
  });
  
  const [editMembers, setEditMembers] = useState<Array<{id: string; name: string; email: string; role: string}>>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "CONTRIBUTOR" });

  useEffect(() => {
    fetchProjects();
  }, []);

  // Process data for status pie chart
  const statusChartData = useMemo(() => {
    const statusCount: Record<string, number> = {
      DRAFT: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    
    projects.forEach((project) => {
      if (statusCount.hasOwnProperty(project.status)) {
        statusCount[project.status]++;
      }
    });

    const statusConfig: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "hsl(220, 60%, 70%)" },
      IN_PROGRESS: { label: "In Progress", color: "hsl(200, 70%, 60%)" },
      ON_HOLD: { label: "On Hold", color: "hsl(45, 90%, 60%)" },
      COMPLETED: { label: "Completed", color: "hsl(142, 70%, 50%)" },
      CANCELLED: { label: "Cancelled", color: "hsl(0, 70%, 60%)" },
    };

    const chartData = Object.entries(statusCount)
      .map(([status, count]) => ({
        status: statusConfig[status]?.label || status,
        count,
        fill: statusConfig[status]?.color || "hsl(0, 0%, 50%)",
      }))
      .filter(item => item.count > 0);

    return chartData;
  }, [projects]);

  // Process data for monthly growth area chart
  const monthlyGrowthData = useMemo(() => {
    const monthlyCount: Record<string, number> = {};
    
    projects.forEach((project) => {
      const date = new Date(project.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyCount).sort();
    let cumulative = 0;

    return sortedMonths.map((month) => {
      cumulative += monthlyCount[month];
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: monthName,
        projects: monthlyCount[month],
        total: cumulative,
      };
    });
  }, [projects]);

  const statusChartConfig = {
    Draft: {
      label: "Draft",
      color: "hsl(220, 60%, 70%)",
    },
    "In Progress": {
      label: "In Progress",
      color: "hsl(200, 70%, 60%)",
    },
    "On Hold": {
      label: "On Hold",
      color: "hsl(45, 90%, 60%)",
    },
    Completed: {
      label: "Completed",
      color: "hsl(142, 70%, 50%)",
    },
    Cancelled: {
      label: "Cancelled",
      color: "hsl(0, 70%, 60%)",
    },
  } satisfies ChartConfig;

  const growthChartConfig = {
    projects: {
      label: "Projects Created",
      color: "hsl(262, 70%, 60%)",
    },
  } satisfies ChartConfig;

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ongoing-project");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ongoing projects:", error);
      toast.error("Failed to load ongoing projects");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.abstract?.toLowerCase().includes(query) ||
          project.keywords.some((k) => k.toLowerCase().includes(query)) ||
          project.student.user.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((project) =>
        filters.status.includes(project.status)
      );
    }

    // Keywords filter
    if (filters.keywords.length > 0) {
      filtered = filtered.filter((project) =>
        filters.keywords.some((filterKeyword) =>
          project.keywords.some((projectKeyword) =>
            projectKeyword.toLowerCase().includes(filterKeyword.toLowerCase())
          )
        )
      );
    }

    // Advisor filter
    if (filters.hasAdvisor === "yes") {
      filtered = filtered.filter((project) => project.advisors.length > 0);
    } else if (filters.hasAdvisor === "no") {
      filtered = filtered.filter((project) => project.advisors.length === 0);
    }

    // Start date range
    if (filters.startDateFrom) {
      filtered = filtered.filter(
        (project) =>
          project.startDate && new Date(project.startDate) >= new Date(filters.startDateFrom)
      );
    }
    if (filters.startDateTo) {
      filtered = filtered.filter(
        (project) =>
          project.startDate && new Date(project.startDate) <=
          new Date(filters.startDateTo + "T23:59:59")
      );
    }

    // End date range
    if (filters.endDateFrom) {
      filtered = filtered.filter(
        (project) =>
          project.expectedEndDate && new Date(project.expectedEndDate) >= new Date(filters.endDateFrom)
      );
    }
    if (filters.endDateTo) {
      filtered = filtered.filter(
        (project) =>
          project.expectedEndDate && new Date(project.expectedEndDate) <=
          new Date(filters.endDateTo + "T23:59:59")
      );
    }

    // Members count range
    if (filters.membersMin) {
      filtered = filtered.filter(
        (project) => project.members.length >= parseInt(filters.membersMin)
      );
    }
    if (filters.membersMax) {
      filtered = filtered.filter(
        (project) => project.members.length <= parseInt(filters.membersMax)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "startDate":
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case "expectedEndDate":
          aValue = a.expectedEndDate ? new Date(a.expectedEndDate).getTime() : 0;
          bValue = b.expectedEndDate ? new Date(b.expectedEndDate).getTime() : 0;
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "members":
          aValue = a.members.length;
          bValue = b.members.length;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchQuery, filters, sortField, sortOrder]);

  // Paginated projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);

  // Get unique keywords from all projects
  const allKeywords = useMemo(() => {
    const keywordSet = new Set<string>();
    projects.forEach((project) => {
      project.keywords.forEach((keyword) => keywordSet.add(keyword));
    });
    return Array.from(keywordSet).sort();
  }, [projects]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(paginatedProjects.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
    }
  };

  const handleEdit = (project: OngoingProject) => {
    setEditingProject(project);
    setEditForm({
      title: project.title,
      abstract: project.abstract || "",
      keywords: project.keywords.join(", "),
      repositoryUrl: project.repositoryUrl || "",
      documentUrl: project.documentUrl || "",
      imageUrl: project.imageUrl || "",
    });
    setEditMembers(project.members.map(m => ({
      id: m.member.id,
      name: m.member.name,
      email: m.member.email,
      role: m.role
    })));
    setEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      const response = await axios.patch(
        `/api/ongoing-project/${editingProject.id}`,
        {
          title: editForm.title,
          abstract: editForm.abstract,
          keywords: editForm.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          repositoryUrl: editForm.repositoryUrl,
          documentUrl: editForm.documentUrl,
          imageUrl: editForm.imageUrl,
        }
      );

      if (response.data.success) {
        toast.success("Project updated successfully");
        fetchProjects();
        setEditDialogOpen(false);
        setEditingProject(null);
        setEditMembers([]);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.email) {
      setEditMembers([...editMembers, { ...newMember, id: Date.now().toString() }]);
      setNewMember({ name: "", email: "", role: "CONTRIBUTOR" });
    }
  };

  const handleRemoveMember = (id: string) => {
    setEditMembers(editMembers.filter(m => m.id !== id));
  };

  const handleBulkDelete = async () => {
    try {
      const projectsToDelete = deletingSingleProject ? [deletingSingleProject] : selectedProjects;
      await Promise.all(
        projectsToDelete.map((id) =>
          axios.delete(`/api/ongoing-project/${id}`)
        )
      );
      toast.success(`${projectsToDelete.length} project(s) deleted successfully`);
      setSelectedProjects([]);
      setDeleteDialogOpen(false);
      setDeletingSingleProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting projects:", error);
      toast.error("Failed to delete projects");
    }
  };

  const handleDeleteSingle = (projectId: string) => {
    setDeletingSingleProject(projectId);
    setDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      keywords: [],
      hasAdvisor: "all",
      startDateFrom: "",
      startDateTo: "",
      endDateFrom: "",
      endDateTo: "",
      membersMin: "",
      membersMax: "",
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.keywords.length > 0) count++;
    if (filters.hasAdvisor !== "all") count++;
    if (filters.startDateFrom || filters.startDateTo) count++;
    if (filters.endDateFrom || filters.endDateTo) count++;
    if (filters.membersMin || filters.membersMax) count++;
    return count;
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; label: string; bgColor: string; textColor: string; borderColor: string }> = {
      DRAFT: { 
        icon: Clock, 
        label: "Draft", 
        bgColor: 'var(--forth-color)',
        textColor: 'var(--first-color)',
        borderColor: 'var(--third-color)'
      },
      IN_PROGRESS: { 
        icon: AlertCircle, 
        label: "In Progress", 
        bgColor: '#DBEAFE',
        textColor: '#1E40AF',
        borderColor: '#3B82F6'
      },
      ON_HOLD: { 
        icon: AlertCircle, 
        label: "On Hold", 
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        borderColor: '#FCD34D'
      },
      COMPLETED: { 
        icon: CheckCircle, 
        label: "Completed", 
        bgColor: '#D1FAE5',
        textColor: '#065F46',
        borderColor: '#34D399'
      },
      CANCELLED: { 
        icon: XCircle, 
        label: "Cancelled", 
        bgColor: '#FEE2E2',
        textColor: '#991B1B',
        borderColor: '#F87171'
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

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--forth-color) 0%, rgba(255,255,255,0.9) 50%, var(--third-color) 100%)' }}>
        <div className="container max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 lg:mb-12">
            <div className="space-y-3">
              <Skeleton className="h-10 sm:h-12 w-64 sm:w-80" />
              <Skeleton className="h-4 w-48 sm:w-64" />
            </div>
            <Skeleton className="h-10 sm:h-12 w-full sm:w-48" />
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 sm:h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--forth-color) 0%, rgba(255,255,255,0.9) 50%, var(--third-color) 100%)' }}>
      <div className="container max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 lg:mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              My Ongoing Projects
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Manage and track your development projects
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/student/ongoing-project/upload")}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto border-0 hover:opacity-90"
            style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Project
          </Button>
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <Card className="border-2 border-dashed bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm" style={{ borderColor: 'var(--third-color)' }}>
            <CardContent className="text-center py-16 sm:py-20">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'linear-gradient(to bottom right, var(--third-color), var(--forth-color))' }}>
                <FolderKanban className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: 'var(--first-color)' }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                No ongoing projects yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                Start by creating your first project and begin tracking your development work
              </p>
              <Button
                onClick={() => router.push("/dashboard/student/ongoing-project/upload")}
                className="text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:opacity-90"
                style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Charts Section */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Status Pie Chart - 1/3 width */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardHeader className="items-center pb-2">
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Projects by status • Total: {projects.length}</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer
                    config={statusChartConfig}
                    className="w-full h-[180px]"
                  >
                    <PieChart width={300} height={300}>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={statusChartData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius="30%"
                        outerRadius="100%"
                        strokeWidth={5}
                        label={(entry) => entry.count}
                        labelLine={false}
                        cx="50%"
                        cy="50%"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend
                        content={<ChartLegendContent nameKey="status" />}
                        className="-translate-y-2 flex-wrap gap-1 [&>*]:basis-1/3 [&>*]:justify-center"
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm pt-0">
                  <div className="text-xs text-muted-foreground text-center">
                    Distribution of projects by current status
                  </div>
                </CardFooter>
              </Card>

              {/* Monthly Growth Area Chart - 2/3 width */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Monthly project creation trend</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <ChartContainer config={growthChartConfig} className="w-full h-[180px]">
                    <AreaChart
                      data={monthlyGrowthData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area
                        dataKey="projects"
                        type="natural"
                        fill="var(--color-projects)"
                        fillOpacity={0.4}
                        stroke="var(--color-projects)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 font-medium leading-none">
                        Trending {monthlyGrowthData.length > 0 && monthlyGrowthData[monthlyGrowthData.length - 1].projects > 0 ? 'up' : ''} <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        {monthlyGrowthData.length > 0 ? `${monthlyGrowthData[0].month} - ${monthlyGrowthData[monthlyGrowthData.length - 1].month}` : 'No data available'}
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Projects Table */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>All Projects</CardTitle>
                      <CardDescription>
                        {filteredAndSortedProjects.length} project(s) found
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProjects.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete ({selectedProjects.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects by title, abstract, keywords..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setFilterDialogOpen(true)}
                      className="relative"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge
                          className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                          style={{ background: 'var(--second-color)' }}
                        >
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              paginatedProjects.length > 0 &&
                              selectedProjects.length === paginatedProjects.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("title")}
                            className="h-8 font-semibold"
                          >
                            Title
                            {sortField === "title" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "title" && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("status")}
                            className="h-8 font-semibold"
                          >
                            Status
                            {sortField === "status" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "status" && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Keywords</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("members")}
                            className="h-8 font-semibold"
                          >
                            Members
                            {sortField === "members" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "members" && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Advisors</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("startDate")}
                            className="h-8 font-semibold"
                          >
                            Start Date
                            {sortField === "startDate" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "startDate" && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("updatedAt")}
                            className="h-8 font-semibold"
                          >
                            Updated
                            {sortField === "updatedAt" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "updatedAt" && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
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
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No projects found. Try adjusting your search or filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedProjects.map((project) => (
                          <TableRow
                            key={project.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedProjects.includes(project.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectProject(project.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell 
                              className="font-medium max-w-xs cursor-pointer"
                              onClick={() => router.push(`/dashboard/student/ongoing-project/${project.id}`)}
                            >
                              <div className="flex items-start gap-2">
                                <FolderKanban
                                  className="h-4 w-4 mt-1 flex-shrink-0"
                                  style={{ color: "var(--second-color)" }}
                                />
                                <span className="line-clamp-2">{project.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(project.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {project.keywords.slice(0, 2).map((keyword, index) => (
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users
                                  className="h-4 w-4"
                                  style={{ color: "var(--second-color)" }}
                                />
                                <span>{project.members.length}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.advisors.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{
                                      background:
                                        "linear-gradient(to bottom right, var(--second-color), var(--third-color))",
                                    }}
                                  >
                                    <User className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm truncate max-w-[100px]">
                                    {project.advisors[0].advisor.name}
                                  </span>
                                  {project.advisors.length > 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{project.advisors.length - 1}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {project.startDate ? formatDate(project.startDate) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(project.updatedAt)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/student/ongoing-project/${project.id}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(project)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSingle(project.id)}
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

                {/* Pagination */}
                <div className="mt-4">
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
          </div>
        )}

        {/* Filter Dialog */}
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filter Ongoing Projects</DialogTitle>
              <DialogDescription>
                Apply filters to narrow down your projects
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["DRAFT", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"].map(
                    (status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({
                                ...filters,
                                status: [...filters.status, status],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                status: filters.status.filter((s) => s !== status),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                          {status.replace(/_/g, " ")}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Keywords Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Keywords</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {allKeywords.length > 0 ? (
                    allKeywords.map((keyword) => (
                      <div key={keyword} className="flex items-center space-x-2">
                        <Checkbox
                          id={`keyword-${keyword}`}
                          checked={filters.keywords.includes(keyword)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({
                                ...filters,
                                keywords: [...filters.keywords, keyword],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                keywords: filters.keywords.filter((k) => k !== keyword),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`keyword-${keyword}`} className="text-sm font-normal cursor-pointer">
                          {keyword}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-2">No keywords available</p>
                  )}
                </div>
              </div>

              {/* Advisor Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Has Advisor</Label>
                <Select
                  value={filters.hasAdvisor}
                  onValueChange={(value) =>
                    setFilters({ ...filters, hasAdvisor: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="yes">With Advisor</SelectItem>
                    <SelectItem value="no">Without Advisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Range */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Start Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="startDateFrom" className="text-sm">From</Label>
                    <Input
                      id="startDateFrom"
                      type="date"
                      value={filters.startDateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, startDateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startDateTo" className="text-sm">To</Label>
                    <Input
                      id="startDateTo"
                      type="date"
                      value={filters.startDateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, startDateTo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* End Date Range */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Expected End Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="endDateFrom" className="text-sm">From</Label>
                    <Input
                      id="endDateFrom"
                      type="date"
                      value={filters.endDateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, endDateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDateTo" className="text-sm">To</Label>
                    <Input
                      id="endDateTo"
                      type="date"
                      value={filters.endDateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, endDateTo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Members Count Range */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Number of Members</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="membersMin" className="text-sm">Minimum</Label>
                    <Input
                      id="membersMin"
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={filters.membersMin}
                      onChange={(e) =>
                        setFilters({ ...filters, membersMin: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="membersMax" className="text-sm">Maximum</Label>
                    <Input
                      id="membersMax"
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={filters.membersMax}
                      onChange={(e) =>
                        setFilters({ ...filters, membersMax: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              <Button
                onClick={() => {
                  setFilterDialogOpen(false);
                  setCurrentPage(1);
                }}
                style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                className="text-white"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingProject(null);
            setEditMembers([]);
            setNewMember({ name: "", email: "", role: "CONTRIBUTOR" });
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, var(--forth-color) 100%)',
            border: '2px solid',
            borderImage: 'linear-gradient(to right, var(--second-color), var(--third-color)) 1'
          }}>
            {/* Header with gradient */}
            <div className="relative -m-6 mb-4 p-6 pb-8" style={{
              background: 'linear-gradient(135deg, var(--first-color) 0%, var(--second-color) 100%)',
            }}>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  Edit Ongoing Project
                </DialogTitle>
                <DialogDescription className="text-white/90 mt-2">
                  Update your project details, manage team members, and track progress
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-6 pb-4">
                {/* Current Status Display (Read-only) */}
                {editingProject && (
                  <div className="p-4 rounded-lg border-2" style={{ 
                    borderColor: 'var(--third-color)',
                    background: 'rgba(255,255,255,0.5)'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                          Current Status
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Update project status based on current progress</p>
                      </div>
                      {getStatusBadge(editingProject.status)}
                    </div>
                  </div>
                )}

                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: 'var(--third-color)' }}>
                    <FolderKanban className="h-5 w-5" style={{ color: 'var(--second-color)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-semibold flex items-center gap-2">
                      <span style={{ color: 'var(--first-color)' }}>Project Title</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      placeholder="Enter project title"
                      className="border-2 focus-visible:ring-0 transition-all"
                      style={{ 
                        borderColor: 'var(--third-color)',
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-abstract" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                      Abstract
                    </Label>
                    <Textarea
                      id="edit-abstract"
                      value={editForm.abstract}
                      onChange={(e) =>
                        setEditForm({ ...editForm, abstract: e.target.value })
                      }
                      placeholder="Provide a brief summary of your project"
                      rows={4}
                      className="border-2 focus-visible:ring-0 resize-none"
                      style={{ borderColor: 'var(--third-color)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-keywords" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                      Keywords
                    </Label>
                    <Input
                      id="edit-keywords"
                      value={editForm.keywords}
                      onChange={(e) =>
                        setEditForm({ ...editForm, keywords: e.target.value })
                      }
                      placeholder="Web Development, React, Node.js (comma-separated)"
                      className="border-2 focus-visible:ring-0"
                      style={{ borderColor: 'var(--third-color)' }}
                    />
                    <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-repository" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                        Repository URL
                      </Label>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" style={{ color: 'var(--second-color)' }} />
                        <Input
                          id="edit-repository"
                          value={editForm.repositoryUrl}
                          onChange={(e) =>
                            setEditForm({ ...editForm, repositoryUrl: e.target.value })
                          }
                          placeholder="https://github.com/user/repo"
                          className="border-2 focus-visible:ring-0 flex-1"
                          style={{ borderColor: 'var(--third-color)' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-document" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                        Document URL
                      </Label>
                      <Input
                        id="edit-document"
                        value={editForm.documentUrl}
                        onChange={(e) =>
                          setEditForm({ ...editForm, documentUrl: e.target.value })
                        }
                        placeholder="https://docs.google.com/..."
                        className="border-2 focus-visible:ring-0"
                        style={{ borderColor: 'var(--third-color)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: 'var(--third-color)' }}>
                    <Users className="h-5 w-5" style={{ color: 'var(--second-color)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>
                      Team Members
                    </h3>
                  </div>

                  {/* Current Members */}
                  {editMembers.length > 0 && (
                    <div className="space-y-2">
                      {editMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-md"
                          style={{ 
                            borderColor: 'var(--third-color)',
                            background: 'rgba(255,255,255,0.5)'
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{
                              background: `linear-gradient(135deg, var(--second-color), var(--third-color))`
                            }}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ color: 'var(--first-color)' }}>
                                {member.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge 
                              variant="outline"
                              style={{ 
                                backgroundColor: 'var(--forth-color)',
                                borderColor: 'var(--third-color)',
                                color: 'var(--first-color)'
                              }}
                            >
                              {member.role.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="ml-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Member */}
                  <div className="p-4 rounded-lg border-2 border-dashed space-y-3" style={{ 
                    borderColor: 'var(--third-color)',
                    background: 'rgba(255,255,255,0.3)'
                  }}>
                    <Label className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                      Add Team Member
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="Member name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="border-2 focus-visible:ring-0"
                        style={{ borderColor: 'var(--third-color)' }}
                      />
                      <Input
                        placeholder="Email address"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        className="border-2 focus-visible:ring-0"
                        style={{ borderColor: 'var(--third-color)' }}
                      />
                      <Select
                        value={newMember.role}
                        onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                      >
                        <SelectTrigger className="border-2" style={{ borderColor: 'var(--third-color)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEAD">Lead</SelectItem>
                          <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                          <SelectItem value="TESTER">Tester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddMember}
                      variant="outline"
                      className="w-full border-2"
                      style={{ 
                        borderColor: 'var(--second-color)',
                        color: 'var(--second-color)'
                      }}
                      disabled={!newMember.name || !newMember.email}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </div>

                {/* Advisors Information (Read-only) */}
                {editingProject?.advisors && editingProject.advisors.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: 'var(--third-color)' }}>
                      <User className="h-5 w-5" style={{ color: 'var(--second-color)' }} />
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>
                        Advisors
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {editingProject.advisors.map((advisor) => (
                        <div key={advisor.advisor.id} className="flex items-center gap-3 p-4 rounded-lg border-2" style={{ 
                          borderColor: 'var(--third-color)',
                          background: 'rgba(255,255,255,0.5)'
                        }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{
                            background: `linear-gradient(135deg, var(--second-color), var(--third-color))`
                          }}>
                            {advisor.advisor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--first-color)' }}>
                              {advisor.advisor.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{advisor.advisor.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with gradient */}
            <DialogFooter className="relative -mx-6 -mb-6 mt-4 p-6 pt-4 border-t-2" style={{ 
              borderColor: 'var(--third-color)',
              background: 'linear-gradient(to right, var(--forth-color), rgba(255,255,255,0.5))'
            }}>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingProject(null);
                    setEditMembers([]);
                  }}
                  className="flex-1 sm:flex-initial border-2"
                  style={{ borderColor: 'var(--third-color)' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProject}
                  className="flex-1 sm:flex-initial text-white shadow-lg hover:shadow-xl transition-all border-0 hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingSingleProject(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {deletingSingleProject ? '1' : selectedProjects.length} project(s).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
