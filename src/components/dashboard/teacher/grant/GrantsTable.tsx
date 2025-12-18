"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash,
} from "lucide-react";
import { GrantFormDialog } from "./GrantFormDialog";
import { FilterDialog } from "./FilterDialog";
import { TablePagination } from "../../TablePagination";
import { fetchGrants, deleteGrant, deleteMultipleGrants } from "@/lib/api/teacherApi";
import { exportGrantIn } from "@/lib/csvExport";
import toast from "react-hot-toast";

export function GrantsTable() {
  const [grants, setGrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [titleInput, setTitleInput] = useState<string>("");

  const [filters, setFilters] = useState<{
    page?: number;
    limit?: number;
    all?: boolean;
    title?: string;
    isPublic?: boolean;
    projectCode?: string;
    projectPI?: string;
    projectCoPI?: string;
    status?: string;
    appliedAfter?: string;
    appliedBefore?: string;
    grantedAfter?: string;
    grantedBefore?: string;
    completedAfter?: string;
    completedBefore?: string;
    investigatorName?: string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({
    page: 1,
    limit: 10,
    sortBy: "grantedAt",
    sortOrder: "desc",
  });

  // Debounce title input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        title: titleInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [titleInput]);

  useEffect(() => {
    loadGrants();
  }, [filters]);

  const loadGrants = async () => {
    setIsLoading(true);
    try {
      const result = await fetchGrants();
      setGrants(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    const updates: any = {
      ...{ [key]: value },
    };

    if (key === "page" || key === "limit") {
      if (key === "page") {
        updates.all = false;
      }
    } else {
      updates.page = 1;
    }

    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: "grantedAt",
      sortOrder: "desc",
    });
    setTitleInput("");
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGrant(deleteId);
      loadGrants();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await deleteMultipleGrants(selectedIds);
      loadGrants();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelectAll = () => {
    const allPageIds = grants.map((g) => g.id);
    const allSelected = allPageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
  ).length;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && grants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <CardTitle
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  background:
                    "linear-gradient(to right, var(--first-color), var(--second-color))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Grants & Projects
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your funded research grants and projects
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
              <Button
                onClick={() =>
                  exportGrantIn(grants, "grants.xlsx")
                }
                variant="outline"
                className="w-full sm:w-auto gap-2"
                size="sm"
                style={{
                  borderColor: "var(--third-color)",
                  color: "var(--first-color)",
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  setSelectedGrant(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Grant
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />

            <Select
              value={
                filters.isPublic === undefined
                  ? "all"
                  : filters.isPublic
                    ? "public"
                    : "private"
              }
              onValueChange={(value) =>
                updateFilter(
                  "isPublic",
                  value === "all" ? undefined : value === "public"
                )
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] hidden md:flex">
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4 border rounded-md px-3 py-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-records"
                  checked={filters.all || false}
                  onCheckedChange={(checked) =>
                    updateFilter("all", checked === true)
                  }
                />
                <label
                  htmlFor="all-records"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show All Records
                </label>
              </div>
            </div>

            <Select
              value={filters.limit?.toString() || "10"}
              onValueChange={(val) => updateFilter("limit", Number(val))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border-2"
              style={{
                borderColor: "var(--third-color)",
                backgroundColor: "var(--forth-color)",
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-sm font-semibold px-3 py-1"
                  style={{
                    background:
                      "linear-gradient(to right, var(--first-color), var(--second-color))",
                    color: "white",
                  }}
                >
                  {selectedIds.length} Selected
                </Badge>
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
          <div className="w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        grants.length > 0 &&
                        grants.every((g) => selectedIds.includes(g.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Title
                      {filters.sortBy === "title" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                      {filters.sortBy !== "title" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Project Code</TableHead>
                  <TableHead className="min-w-[150px]">PI</TableHead>
                  <TableHead className="min-w-[150px]">Co-PI</TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Status
                      {filters.sortBy === "status" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("grantAmount")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Grant Amount
                      {filters.sortBy === "grantAmount" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("appliedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Applied Date
                      {filters.sortBy === "appliedAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("grantedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Granted Date
                      {filters.sortBy === "grantedAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("completedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Completed Date
                      {filters.sortBy === "completedAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Investigators</TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("isPublic")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Visibility
                      {filters.sortBy === "isPublic" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Created At
                      {filters.sortBy === "createdAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : grants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {activeFilterCount > 0
                        ? "No grants match your filters."
                        : "No grants found. Create your first one!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  grants.map((grant) => {
                    return (
                      <TableRow
                        key={grant.id}
                        className={
                          selectedIds.includes(grant.id)
                            ? "bg-muted/50 hover:bg-muted/70"
                            : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(grant.id)}
                            onCheckedChange={() => toggleSelectOne(grant.id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={grant.title}>
                            {grant.title}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {grant.projectCode || "—"}
                        </TableCell>
                        <TableCell>{grant.projectPI || "—"}</TableCell>
                        <TableCell>{grant.projectCoPI || "—"}</TableCell>
                        <TableCell>
                          {grant.status ? (
                            <Badge variant="outline">{grant.status}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {grant.grantAmount
                            ? formatCurrency(grant.grantAmount)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {grant.appliedAt ? formatDate(grant.appliedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {grant.grantedAt ? formatDate(grant.grantedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {grant.completedAt
                            ? formatDate(grant.completedAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {grant.investigators
                              ?.slice(0, 2)
                              .map((inv: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {inv.role}
                                </Badge>
                              ))}
                            {grant.investigators?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{grant.investigators.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {grant.isPublic ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Eye className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                Public
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                Private
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(grant.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGrant(grant);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteId(grant.id);
                                  setIsDeleteOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <div className="px-6 py-4 border-t">
          <TablePagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={filters.limit || 10}
            onPageChange={(page) => updateFilter("page", page)}
          />
        </div>
      </Card>

      <GrantFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        grant={selectedGrant}
        onSuccess={loadGrants}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              grant entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Grants?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedIds.length} grant{selectedIds.length > 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMultiDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
