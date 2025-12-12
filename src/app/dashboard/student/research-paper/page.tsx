"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FileText,
  Plus,
  Calendar,
  User,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  Filter,
  Trash2,
  Edit,
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

interface ResearchPaper {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  status: string;
  documentUrl?: string;
  imageUrl?: string;
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
  reviewedBy?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  members: {
    member: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }[];
}

type SortField = "title" | "status" | "createdAt" | "updatedAt" | "members";
type SortOrder = "asc" | "desc";

interface Filters {
  status: string[];
  keywords: string[];
  hasReviewer: string;
  submittedFrom: string;
  submittedTo: string;
  publishedFrom: string;
  publishedTo: string;
  membersMin: string;
  membersMax: string;
}

export default function ResearchPaperListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Multi-select
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  
  // Dialogs
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSinglePaper, setDeletingSinglePaper] = useState<string | null>(null);
  const [editingPaper, setEditingPaper] = useState<ResearchPaper | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    status: [],
    keywords: [],
    hasReviewer: "all",
    submittedFrom: "",
    submittedTo: "",
    publishedFrom: "",
    publishedTo: "",
    membersMin: "",
    membersMax: "",
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    documentUrl: "",
    imageUrl: "",
  });
  
  const [editMembers, setEditMembers] = useState<Array<{id: string; name: string; email: string; role: string}>>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "CO_AUTHOR" });

  useEffect(() => {
    fetchPapers();
  }, []);

  // Process data for status pie chart
  const statusChartData = useMemo(() => {
    console.log("🔄 Processing status chart data for papers:", papers.length);
    const statusCount: Record<string, number> = {
      DRAFT: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      PUBLISHED: 0,
    };
    
    papers.forEach((paper) => {
      console.log("📋 Paper Status:", paper.status);
      if (statusCount.hasOwnProperty(paper.status)) {
        statusCount[paper.status]++;
      }
    });

    console.log("📊 Status Count:", statusCount);

    const statusConfig: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "hsl(220, 60%, 70%)" },
      SUBMITTED: { label: "Submitted", color: "hsl(200, 70%, 60%)" },
      UNDER_REVIEW: { label: "Under Review", color: "hsl(45, 90%, 60%)" },
      APPROVED: { label: "Approved", color: "hsl(142, 70%, 50%)" },
      REJECTED: { label: "Rejected", color: "hsl(0, 70%, 60%)" },
      PUBLISHED: { label: "Published", color: "hsl(262, 70%, 60%)" },
    };

    const chartData = Object.entries(statusCount)
      .map(([status, count]) => ({
        status: statusConfig[status]?.label || status,
        count,
        fill: statusConfig[status]?.color || "hsl(0, 0%, 50%)",
      }))
      .filter(item => item.count > 0);

    console.log("📊 Pie Chart Data:", chartData);
    return chartData;
  }, [papers]);

  // Process data for monthly growth area chart
  const monthlyGrowthData = useMemo(() => {
    const monthlyCount: Record<string, number> = {};
    
    papers.forEach((paper) => {
      const date = new Date(paper.createdAt);
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
        papers: monthlyCount[month],
        total: cumulative,
      };
    });
  }, [papers]);

  const statusChartConfig = {
    Draft: {
      label: "Draft",
      color: "hsl(220, 60%, 70%)",
    },
    Submitted: {
      label: "Submitted",
      color: "hsl(200, 70%, 60%)",
    },
    "Under Review": {
      label: "Under Review",
      color: "hsl(45, 90%, 60%)",
    },
    Approved: {
      label: "Approved",
      color: "hsl(142, 70%, 50%)",
    },
    Rejected: {
      label: "Rejected",
      color: "hsl(0, 70%, 60%)",
    },
    Published: {
      label: "Published",
      color: "hsl(262, 70%, 60%)",
    },
  } satisfies ChartConfig;

  const growthChartConfig = {
    papers: {
      label: "Papers Uploaded",
      color: "hsl(262, 70%, 60%)",
    },
  } satisfies ChartConfig;

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/research-paper");
      console.log("📊 API Response:", response.data);
      if (response.data.success) {
        console.log("📄 Fetched Papers:", response.data.data);
        console.log("📈 Total Papers Count:", response.data.data.length);
        setPapers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching research papers:", error);
      toast.error("Failed to load research papers");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort papers
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = [...papers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(query) ||
          paper.abstract?.toLowerCase().includes(query) ||
          paper.keywords.some((k) => k.toLowerCase().includes(query)) ||
          paper.student.user.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((paper) =>
        filters.status.includes(paper.status)
      );
    }

    // Keywords filter
    if (filters.keywords.length > 0) {
      filtered = filtered.filter((paper) =>
        filters.keywords.some((filterKeyword) =>
          paper.keywords.some((paperKeyword) =>
            paperKeyword.toLowerCase().includes(filterKeyword.toLowerCase())
          )
        )
      );
    }

    // Reviewer filter
    if (filters.hasReviewer === "yes") {
      filtered = filtered.filter((paper) => paper.reviewedBy);
    } else if (filters.hasReviewer === "no") {
      filtered = filtered.filter((paper) => !paper.reviewedBy);
    }

    // Submitted date range
    if (filters.submittedFrom) {
      filtered = filtered.filter(
        (paper) =>
          paper.submittedAt && new Date(paper.submittedAt) >= new Date(filters.submittedFrom)
      );
    }
    if (filters.submittedTo) {
      filtered = filtered.filter(
        (paper) =>
          paper.submittedAt && new Date(paper.submittedAt) <=
          new Date(filters.submittedTo + "T23:59:59")
      );
    }

    // Published date range
    if (filters.publishedFrom) {
      filtered = filtered.filter(
        (paper) =>
          paper.publishedAt && new Date(paper.publishedAt) >= new Date(filters.publishedFrom)
      );
    }
    if (filters.publishedTo) {
      filtered = filtered.filter(
        (paper) =>
          paper.publishedAt && new Date(paper.publishedAt) <=
          new Date(filters.publishedTo + "T23:59:59")
      );
    }

    // Members count range
    if (filters.membersMin) {
      filtered = filtered.filter(
        (paper) => paper.members.length >= parseInt(filters.membersMin)
      );
    }
    if (filters.membersMax) {
      filtered = filtered.filter(
        (paper) => paper.members.length <= parseInt(filters.membersMax)
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
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
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
  }, [papers, searchQuery, filters, sortField, sortOrder]);

  // Paginated papers
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPapers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPapers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedPapers.length / itemsPerPage);

  // Get unique keywords from all papers
  const allKeywords = useMemo(() => {
    const keywordSet = new Set<string>();
    papers.forEach((paper) => {
      paper.keywords.forEach((keyword) => keywordSet.add(keyword));
    });
    return Array.from(keywordSet).sort();
  }, [papers]);

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
      setSelectedPapers(paginatedPapers.map((p) => p.id));
    } else {
      setSelectedPapers([]);
    }
  };

  const handleSelectPaper = (paperId: string, checked: boolean) => {
    if (checked) {
      setSelectedPapers([...selectedPapers, paperId]);
    } else {
      setSelectedPapers(selectedPapers.filter((id) => id !== paperId));
    }
  };

  const handleEdit = (paper: ResearchPaper) => {
    setEditingPaper(paper);
    setEditForm({
      title: paper.title,
      abstract: paper.abstract || "",
      keywords: paper.keywords.join(", "),
      documentUrl: paper.documentUrl || "",
      imageUrl: paper.imageUrl || "",
    });
    setEditMembers(paper.members.map(m => ({
      id: m.member.id,
      name: m.member.name,
      email: m.member.email,
      role: m.role
    })));
    setEditDialogOpen(true);
  };

  const handleUpdatePaper = async () => {
    if (!editingPaper) return;

    try {
      const response = await axios.patch(
        `/api/research-paper/${editingPaper.id}`,
        {
          title: editForm.title,
          abstract: editForm.abstract,
          keywords: editForm.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          documentUrl: editForm.documentUrl,
          imageUrl: editForm.imageUrl,
        }
      );

      if (response.data.success) {
        toast.success("Paper updated successfully");
        fetchPapers();
        setEditDialogOpen(false);
        setEditingPaper(null);
        setEditMembers([]);
      }
    } catch (error) {
      console.error("Error updating paper:", error);
      toast.error("Failed to update paper");
    }
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.email) {
      setEditMembers([...editMembers, { ...newMember, id: Date.now().toString() }]);
      setNewMember({ name: "", email: "", role: "CO_AUTHOR" });
    }
  };

  const handleRemoveMember = (id: string) => {
    setEditMembers(editMembers.filter(m => m.id !== id));
  };
  const handleBulkDelete = async () => {
    try {
      const papersToDelete = deletingSinglePaper ? [deletingSinglePaper] : selectedPapers;
      await Promise.all(
        papersToDelete.map((id) =>
          axios.delete(`/api/research-paper/${id}`)
        )
      );
      toast.success(`${papersToDelete.length} paper(s) deleted successfully`);
      setSelectedPapers([]);
      setDeleteDialogOpen(false);
      setDeletingSinglePaper(null);
      fetchPapers();
    } catch (error) {
      console.error("Error deleting papers:", error);
      toast.error("Failed to delete papers");
    }
  };

  const handleDeleteSingle = (paperId: string) => {
    setDeletingSinglePaper(paperId);
    setDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      keywords: [],
      hasReviewer: "all",
      submittedFrom: "",
      submittedTo: "",
      publishedFrom: "",
      publishedTo: "",
      membersMin: "",
      membersMax: "",
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.keywords.length > 0) count++;
    if (filters.hasReviewer !== "all") count++;
    if (filters.submittedFrom || filters.submittedTo) count++;
    if (filters.publishedFrom || filters.publishedTo) count++;
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
      SUBMITTED: { 
        icon: AlertCircle, 
        label: "Submitted", 
        bgColor: 'var(--third-color)',
        textColor: 'var(--first-color)',
        borderColor: 'var(--second-color)'
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
              My Research Papers
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Manage and track your research publications
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/student/research-paper/upload")}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto border-0 hover:opacity-90"
            style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload New Paper
          </Button>
        </div>

        {/* Empty State */}
        {papers.length === 0 ? (
          <Card className="border-2 border-dashed bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm" style={{ borderColor: 'var(--third-color)' }}>
            <CardContent className="text-center py-16 sm:py-20">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'linear-gradient(to bottom right, var(--third-color), var(--forth-color))' }}>
                <FileText className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: 'var(--first-color)' }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                No research papers yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                Start by uploading your first research paper and begin tracking your academic contributions
              </p>
              <Button
                onClick={() => router.push("/dashboard/student/research-paper/upload")}
                className="text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:opacity-90"
                style={{ background: 'linear-gradient(to right, var(--first-color), var(--second-color))' }}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Upload Research Paper
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
                  <CardDescription>Papers by status • Total: {papers.length}</CardDescription>
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
                    Distribution of papers by review status
                  </div>
                </CardFooter>
              </Card>

              {/* Monthly Growth Area Chart - 2/3 width */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Upload Trend</CardTitle>
                  <CardDescription>Monthly research paper uploads</CardDescription>
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
                        dataKey="papers"
                        type="natural"
                        fill="var(--color-papers)"
                        fillOpacity={0.4}
                        stroke="var(--color-papers)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 font-medium leading-none">
                        Trending {monthlyGrowthData.length > 0 && monthlyGrowthData[monthlyGrowthData.length - 1].papers > 0 ? 'up' : ''} <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        {monthlyGrowthData.length > 0 ? `${monthlyGrowthData[0].month} - ${monthlyGrowthData[monthlyGrowthData.length - 1].month}` : 'No data available'}
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Papers Table */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>All Research Papers</CardTitle>
                      <CardDescription>
                        {filteredAndSortedPapers.length} paper(s) found
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPapers.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete ({selectedPapers.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search papers by title, abstract, keywords..."
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
                              paginatedPapers.length > 0 &&
                              selectedPapers.length === paginatedPapers.length
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
                        <TableHead>Reviewer</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("createdAt")}
                            className="h-8 font-semibold"
                          >
                            Created
                            {sortField === "createdAt" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              ))}
                            {sortField !== "createdAt" && (
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
                      {paginatedPapers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No papers found. Try adjusting your search or filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPapers.map((paper) => (
                          <TableRow
                            key={paper.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedPapers.includes(paper.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectPaper(paper.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell 
                              className="font-medium max-w-xs cursor-pointer"
                              onClick={() => router.push(`/dashboard/student/research-paper/${paper.id}`)}
                            >
                              <div className="flex items-start gap-2">
                                <FileText
                                  className="h-4 w-4 mt-1 flex-shrink-0"
                                  style={{ color: "var(--second-color)" }}
                                />
                                <span className="line-clamp-2">{paper.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(paper.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {paper.keywords.slice(0, 2).map((keyword, index) => (
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
                                {paper.keywords.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{paper.keywords.length - 2}
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
                                <span>{paper.members.length}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {paper.reviewedBy ? (
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
                                    {paper.reviewedBy.user.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(paper.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(paper.updatedAt)}
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
                                    onClick={() => router.push(`/dashboard/student/research-paper/${paper.id}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(paper)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSingle(paper.id)}
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
                    totalItems={filteredAndSortedPapers.length}
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
              <DialogTitle>Filter Research Papers</DialogTitle>
              <DialogDescription>
                Apply filters to narrow down your research papers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"].map(
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

              {/* Reviewer Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Has Reviewer</Label>
                <Select
                  value={filters.hasReviewer}
                  onValueChange={(value) =>
                    setFilters({ ...filters, hasReviewer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Papers</SelectItem>
                    <SelectItem value="yes">With Reviewer</SelectItem>
                    <SelectItem value="no">Without Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submitted Date Range */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Submitted Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="submittedFrom" className="text-sm">From</Label>
                    <Input
                      id="submittedFrom"
                      type="date"
                      value={filters.submittedFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, submittedFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="submittedTo" className="text-sm">To</Label>
                    <Input
                      id="submittedTo"
                      type="date"
                      value={filters.submittedTo}
                      onChange={(e) =>
                        setFilters({ ...filters, submittedTo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Published Date Range */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Published Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="publishedFrom" className="text-sm">From</Label>
                    <Input
                      id="publishedFrom"
                      type="date"
                      value={filters.publishedFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, publishedFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="publishedTo" className="text-sm">To</Label>
                    <Input
                      id="publishedTo"
                      type="date"
                      value={filters.publishedTo}
                      onChange={(e) =>
                        setFilters({ ...filters, publishedTo: e.target.value })
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
            setEditingPaper(null);
            setEditMembers([]);
            setNewMember({ name: "", email: "", role: "CO_AUTHOR" });
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
                  Edit Research Paper
                </DialogTitle>
                <DialogDescription className="text-white/90 mt-2">
                  Update your research paper details, manage team members, and refine your work
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-6 pb-4">
                {/* Current Status Display (Read-only) */}
                {editingPaper && (
                  <div className="p-4 rounded-lg border-2" style={{ 
                    borderColor: 'var(--third-color)',
                    background: 'rgba(255,255,255,0.5)'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                          Current Status
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Status can only be changed by reviewers</p>
                      </div>
                      {getStatusBadge(editingPaper.status)}
                    </div>
                  </div>
                )}

                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: 'var(--third-color)' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--second-color)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-semibold flex items-center gap-2">
                      <span style={{ color: 'var(--first-color)' }}>Paper Title</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      placeholder="Enter research paper title"
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
                      placeholder="Provide a brief summary of your research"
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
                      placeholder="AI, Machine Learning, Deep Learning (comma-separated)"
                      className="border-2 focus-visible:ring-0"
                      style={{ borderColor: 'var(--third-color)' }}
                    />
                    <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-document" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                        Document File
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-document"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Handle file upload - you can implement upload logic here
                              setEditForm({ ...editForm, documentUrl: URL.createObjectURL(file) });
                            }
                          }}
                          className="border-2 focus-visible:ring-0"
                          style={{ borderColor: 'var(--third-color)' }}
                        />
                      </div>
                      {editForm.documentUrl && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" style={{ color: 'var(--second-color)' }} />
                          <span className="truncate">Document uploaded</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-image" className="text-sm font-semibold" style={{ color: 'var(--first-color)' }}>
                        Cover Image
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Handle image upload
                              setEditForm({ ...editForm, imageUrl: URL.createObjectURL(file) });
                            }
                          }}
                          className="border-2 focus-visible:ring-0"
                          style={{ borderColor: 'var(--third-color)' }}
                        />
                      </div>
                      {editForm.imageUrl && (
                        <div className="mt-2 relative w-full h-24 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--third-color)' }}>
                          <img 
                            src={editForm.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
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
                      {editMembers.map((member, index) => (
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
                          <SelectItem value="CO_AUTHOR">Co-Author</SelectItem>
                          <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
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

                {/* Reviewer Information (Read-only) */}
                {editingPaper?.reviewedBy && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: 'var(--third-color)' }}>
                      <User className="h-5 w-5" style={{ color: 'var(--second-color)' }} />
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--first-color)' }}>
                        Reviewer
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border-2" style={{ 
                      borderColor: 'var(--third-color)',
                      background: 'rgba(255,255,255,0.5)'
                    }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{
                        background: `linear-gradient(135deg, var(--second-color), var(--third-color))`
                      }}>
                        {editingPaper.reviewedBy.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--first-color)' }}>
                          {editingPaper.reviewedBy.user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{editingPaper.reviewedBy.user.email}</p>
                      </div>
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
                    setEditingPaper(null);
                    setEditMembers([]);
                  }}
                  className="flex-1 sm:flex-initial border-2"
                  style={{ borderColor: 'var(--third-color)' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePaper}
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
          if (!open) setDeletingSinglePaper(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {deletingSinglePaper ? '1' : selectedPapers.length} research paper(s).
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
