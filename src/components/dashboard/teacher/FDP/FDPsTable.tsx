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
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash,
  Download,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FDPFormDialog } from "./FDPFormDialog";
import { TablePagination } from "../../TablePagination";
import { FilterDialog } from "./FilterDialog";
import { fetchFDPs, deleteFDP, deleteMultipleFDPs } from "@/lib/api/teacherApi";
import { exportFDPsExcel } from "@/lib/csvExport";

export function FDPsTable() {
  const [fdps, setFdps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFdp, setSelectedFdp] = useState<any>(null);
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
    name?: string;
    isPublic?: boolean;
    organizedBy?: string;
    sponsoredBy?: string;
    startDate?: string;
    startAfter?: string;
    startBefore?: string;
    endDate?: string;
    endAfter?: string;
    endBefore?: string;
    topic?: string;
    venue?: string;
    duration?: string;
    certificateUrl?: string;
    remarks?: string;
    teacherName?: string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({
    page: 1,
    limit: 10,
    sortBy: "startDate",
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
    loadFdps();
  }, [filters]);
  const loadFdps = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFDPs();
      setFdps(result.data || []);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.total);
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

    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
      all: false,
    }));
  };

  const clearFilters = () => {
    setTitleInput("");
    setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      all: false,
    });
  };

  const handleSort = (field: string) => {
    const newOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    updateFilters({ sortBy: field, sortOrder: newOrder });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFDP(deleteId);
      loadFdps();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await deleteMultipleFDPs(selectedIds);
      loadFdps();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const toggleSelectAll = () => {
    const allPageIds = fdps.map((c) => c.id);
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

  if (isLoading && fdps.length === 0) {
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
                FDPs
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your FDP entries
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
                  exportFDPsExcel(fdps, "fdps.xlsx")
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
                  setSelectedFdp(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add FDPs
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
                        fdps.length > 0 &&
                        fdps.every((c) => selectedIds.includes(c.id))
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
                  <TableHead className="min-w-[150px]">Inventors</TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("filedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Filed Date
                      {filters.sortBy === "filedAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                      {filters.sortBy !== "filedAt" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
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
                      {filters.sortBy !== "completedAt" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("publishedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Published Date
                      {filters.sortBy === "publishedAt" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                      {filters.sortBy !== "publishedAt" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
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
                      {filters.sortBy !== "grantedAt" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>

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
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : fdps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {activeFilterCount > 0
                        ? "No fdps match your filters."
                        : "No fdps found. Create your first one!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  fdps.map((copyright) => {
                    return (
                      <TableRow
                        key={copyright.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(copyright.id)}
                            onCheckedChange={() =>
                              toggleSelectOne(copyright.id)
                            }
                            aria-label={`Select ${copyright.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-sm">
                          <div className="line-clamp-2" title={copyright.title}>
                            {copyright.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex -space-x-2">
                              {copyright.inventors
                                ?.slice(0, 3)
                                .map((inventor: any) => (
                                  <Tooltip key={inventor.id}>
                                    <TooltipTrigger>
                                      <Avatar className="w-8 h-8 border-2 border-background">
                                        <AvatarImage
                                          src={inventor.teacher?.user?.image}
                                        />
                                        <AvatarFallback>
                                          {inventor.teacher?.user?.name?.charAt(
                                            0
                                          ) || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {inventor.teacher?.user?.name ||
                                        "Unknown"}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              {copyright.inventors &&
                                copyright.inventors.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                    +{copyright.inventors.length - 3}
                                  </div>
                                )}
                              {(!copyright.inventors ||
                                copyright.inventors.length === 0) && (
                                <span className="text-xs text-muted-foreground">
                                  No inventors
                                </span>
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-sm">
                          {copyright.filedAt
                            ? formatDate(copyright.filedAt)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {copyright.publishedAt
                            ? formatDate(copyright.publishedAt)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {copyright.completedAt
                            ? formatDate(copyright.completedAt)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {copyright.grantedAt
                            ? formatDate(copyright.grantedAt)
                            : "N/A"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              copyright.isPublic ? "default" : "secondary"
                            }
                            className="text-xs"
                            style={
                              copyright.isPublic
                                ? {
                                    background:
                                      "linear-gradient(to right, var(--first-color), var(--second-color))",
                                    color: "white",
                                  }
                                : {}
                            }
                          >
                            {copyright.isPublic ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(copyright.createdAt)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                                onClick={() => {
                                  setSelectedFdp(fdps);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteId(copyright.id);
                                  setIsDeleteOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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

          <div className="mt-4 px-4 pb-4">
            <TablePagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={filters.limit || 10}
              onPageChange={(page) => updateFilter("page", page)}
            />
          </div>
        </CardContent>
      </Card>

      <FDPFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        fdp={selectedFdp}
        onSuccess={fetchFDPs}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the copyright entry.
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
            <AlertDialogTitle>Delete Multiple fdps?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} copyright
              {selectedIds.length > 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMultiDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.length} Item
              {selectedIds.length > 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
