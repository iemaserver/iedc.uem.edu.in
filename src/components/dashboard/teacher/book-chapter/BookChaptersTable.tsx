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
  Trash,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  BookOpen,
  X,
} from "lucide-react";

import { TablePagination } from "../../TablePagination";

import {
  fetchBookChapters as fetchBookChaptersApi,
  deleteBookChapter,
  deleteMultipleBookChapters,
} from "@/lib/api/teacherApi";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookChapterFormDialog } from "../book-chapter/BookChapterFormDialog";
import { FilterDialog } from "../book-chapter/FilterDialog";
import { BookChapter } from "@prisma/client";
import { exportBookChaptersExcel } from "@/lib/csvExport";

interface bookChapterWithAuthors extends BookChapter {
  authors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function BookChaptersTable() {
  const [bookChapters, setBookChapters] = useState<bookChapterWithAuthors[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [titleInput, setTitleInput] = useState<string>(""); // Local title input state

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [selectedBookChapter, setSelectedBookChapter] =
    useState<bookChapterWithAuthors | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");

  const [filters, setFilters] = useState<{
    status?: string;
    isPublic?: boolean;
    title?: string;
    isbnIssn?: string;
    minFees?: number;
    maxFees?: number;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    teacherName?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    all?: boolean;
  }>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
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

  // Fetch data whenever filters change
  useEffect(() => {
    fetchBookChapters();
  }, [filters]);

  const fetchBookChapters = async () => {
    setIsLoading(true);
    try {
      const response = await fetchBookChaptersApi(filters);
      setBookChapters(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      console.error("Error fetching book chapters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    const updates: any = {
      ...{ [key]: value },
    };

    // When changing page, don't reset to page 1
    if (key === "page" || key === "limit") {
      // If changing page/limit, disable "all" mode
      if (key === "page") {
        updates.all = false;
      }
    } else {
      // For other filters, reset to page 1
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
      all: false, // Disable "all" when applying filters
    }));
  };

  const clearFilters = () => {
    setTitleInput(""); // Clear title input
    setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      all: false,
    });
  };

  // Handle sorting - toggles between asc/desc
  const handleSort = (field: string) => {
    const newOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    updateFilters({ sortBy: field, sortOrder: newOrder });
  };

  // CRUD Operations
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBookChapter(deleteId);
      fetchBookChapters();
      setIsDeleteOpen(false);
      setDeleteId("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMultipleBookChapters(selectedIds);
      fetchBookChapters();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Selection functions
  const toggleSelectAll = () => {
    const allPageIds = bookChapters.map((c) => c.id);
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

  // Count active filters (excluding pagination and sort)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
  ).length;

  if (isLoading && bookChapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
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
                Book Chapters
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your book chapter publications
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
                  {
                    console.log("Exporting book chapters:", bookChapters);
                    exportBookChaptersExcel(bookChapters, "book_chapters.xlsx")
                  }
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
                  setSelectedBookChapter(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Book Chapter
              </Button>
            </div>
          </div>

          {/* Search and Filters Row */}
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

            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                updateFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] hidden md:flex">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>

            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
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

          {/* Active Filters Display */}

          {/* Selection Banner */}
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
            

            <Table className="">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        bookChapters.length > 0 &&
                        bookChapters.every((c) => selectedIds.includes(c.id))
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
                      {filters.sortBy !== "status" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Authors</TableHead>
                  <TableHead className="min-w-[130px]">ISBN/ISSN</TableHead>
                  <TableHead className="min-w-[130px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("registrationFees")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Reg. Fees
                      {filters.sortBy === "registrationFees" &&
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
                      onClick={() => handleSort("reimbursement")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Reimburse.
                      {filters.sortBy === "reimbursement" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
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
                  <TableHead className="min-w-[130px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updatedAt")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Updated At
                      {filters.sortBy === "updatedAt" &&
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
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookChapters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {activeFilterCount > 0
                        ? "No book chapters found. Try adjusting your filters."
                        : "No book chapters found. Create your first one!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  bookChapters.map((chapter) => (
                    <TableRow key={chapter.id} className="hover:bg-muted/50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(chapter.id)}
                          onCheckedChange={() => toggleSelectOne(chapter.id)}
                          aria-label={`Select ${chapter.title}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-sm">
                        <div className="flex items-start gap-2">
                          <BookOpen
                            className="h-4 w-4 mt-1 flex-shrink-0"
                            style={{ color: "var(--second-color)" }}
                          />
                          <span className="line-clamp-2">
                            {chapter.title.length > 30
                              ? chapter.title.slice(0, 30) + "..."
                              : chapter.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: "var(--forth-color)",
                            color: "var(--first-color)",
                            borderColor: "var(--third-color)",
                          }}
                        >
                          {chapter.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex -space-x-2">
                            {chapter.authors?.slice(0, 3).map((author) => (
                              <Tooltip key={author.id}>
                                <TooltipTrigger>
                                  <Avatar className="w-8 h-8 border-2 border-background">
                                    <AvatarImage
                                      src={author.teacher?.user?.image}
                                    />
                                    <AvatarFallback>
                                      {author.teacher?.user?.name?.charAt(0) ||
                                        "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {author.teacher?.user?.name || "Unknown"}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {chapter.authors && chapter.authors.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{chapter.authors.length - 3}
                              </div>
                            )}
                            {(!chapter.authors ||
                              chapter.authors.length === 0) && (
                              <span className="text-xs text-muted-foreground">
                                No authors
                              </span>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-sm">
                        {chapter.isbnIssn || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {chapter.registrationFees
                          ? `₹${chapter.registrationFees}`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {chapter.reimbursement
                          ? `₹${chapter.reimbursement}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={chapter.isPublic ? "default" : "secondary"}
                          className="text-xs"
                          style={
                            chapter.isPublic
                              ? {
                                  background:
                                    "linear-gradient(to right, var(--first-color), var(--second-color))",
                                  color: "white",
                                }
                              : {}
                          }
                        >
                          {chapter.isPublic ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(chapter.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(chapter.updatedAt)}
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
                                setSelectedBookChapter(chapter);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteId(chapter.id);
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
                  ))
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

      <BookChapterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        bookChapter={selectedBookChapter}
        onSuccess={fetchBookChapters}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book chapter entry. This action
              cannot be undone.
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
            <AlertDialogTitle>Delete Multiple Book Chapters?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} book chapter
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
