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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Calendar,
  EyeOff,
  Eye,
} from "lucide-react";
import { ConferenceFormDialog } from "./ConferenceFormDialog";
import { TablePagination } from "../../TablePagination";
import { FilterDialog } from "./FilterDialog";
import {
  fetchConferences,
  deleteConference,
  deleteMultipleConferences,
} from "@/lib/api/teacherApi";
import { exportConferenceExcel } from "@/lib/csvExport";
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
import { Conference } from "@prisma/client";


interface conferenceWithAuthors extends Conference {
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

export function ConferencesTable() {
  const [conferences, setConferences] = useState<conferenceWithAuthors[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [titleInput, setTitleInput] = useState<string>("");

  const [filters, setFilters] = useState<{
    isPublic?: boolean;
    conferenceName?: string;
    mode?: string;
    status?: string;
    location?: string;
    publisher?: string;
    typeOfConference?: string;
    indexOfConference?: string;
    reimbursementStatus?: string;
    registrationFeesMin?: number;
    registrationFeesMax?: number;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    conferenceStartAfter?: string;
    conferenceStartBefore?: string;
    conferenceEndAfter?: string;
    conferenceEndBefore?: string;
    teacherName?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    all?: boolean;
  }>({
    page: 1,
    limit: 10,
    sortBy: "conferenceStartDate",
    sortOrder: "desc",
  });

  // Debounce title input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        conferenceName: titleInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [titleInput]);

  // Fetch data whenever filters change
  useEffect(() => {
    fetchConferencesData();
  }, [filters]);

  const fetchConferencesData = async () => {
    setIsLoading(true);
    try {
      // Convert string dates to Date objects for API
      const apiFilters = {
        ...filters,
        createdAfter: filters.createdAfter
          ? new Date(filters.createdAfter)
          : undefined,
        createdBefore: filters.createdBefore
          ? new Date(filters.createdBefore)
          : undefined,
        updatedAfter: filters.updatedAfter
          ? new Date(filters.updatedAfter)
          : undefined,
        updatedBefore: filters.updatedBefore
          ? new Date(filters.updatedBefore)
          : undefined,
        conferenceStartAfter: filters.conferenceStartAfter
          ? new Date(filters.conferenceStartAfter)
          : undefined,
        conferenceStartBefore: filters.conferenceStartBefore
          ? new Date(filters.conferenceStartBefore)
          : undefined,
        conferenceEndAfter: filters.conferenceEndAfter
          ? new Date(filters.conferenceEndAfter)
          : undefined,
        conferenceEndBefore: filters.conferenceEndBefore
          ? new Date(filters.conferenceEndBefore)
          : undefined,
      };
      const result = await fetchConferences(apiFilters);
      setConferences(result.data || []);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.total);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter management functions
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
      sortBy: "conferenceStartDate",
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
      await deleteConference(deleteId);
      fetchConferencesData();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMultipleConferences(selectedIds);
      fetchConferencesData();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelectAll = () => {
    const allPageIds = conferences.map((c) => c.id);
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

  if (isLoading && conferences.length === 0) {
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
                Conference Papers
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your conference publications
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
                  exportConferenceExcel(conferences, "conferences.xlsx")
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
                  setSelectedConference(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Conference
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by conference name..."
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
                        conferences.length > 0 &&
                        conferences.every((c) => selectedIds.includes(c.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>

                  <TableHead className="min-w-[200px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("conferenceName")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Conference
                      {filters.sortBy === "conferenceName" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                      {filters.sortBy !== "conferenceName" && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Authors</TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("mode")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Mode
                      {filters.sortBy === "mode" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
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
                  <TableHead className="min-w-[150px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("conferenceStartDate")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Start Date
                      {filters.sortBy === "conferenceStartDate" &&
                        (filters.sortOrder === "asc" ? (
                          <ChevronUp className=" h-4 w-4" />
                        ) : (
                          <ChevronDown className=" h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("registrationFees")}
                      className="h-8 px-2 hover:bg-muted/50"
                    >
                      Fees
                      {filters.sortBy === "registrationFees" &&
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
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                      No conferences found.
                    </TableCell>
                  </TableRow>
                ) : (
                  conferences.map((conference) => (
                    <TableRow key={conference.id}>
                      <TableCell className="">
                        <Checkbox
                          checked={selectedIds.includes(conference.id)}
                          onCheckedChange={() => toggleSelectOne(conference.id)}
                        />
                      </TableCell>
                     
                      <TableCell>{conference.conferenceName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {conference.authors?.slice(0, 3).map((a: any) => (
                            <Avatar
                              key={a.id}
                              className="h-8 w-8"
                              title={a.teacher.user.name}
                            >
                              {a.teacher.user.image ? (
                                <AvatarImage
                                  src={a.teacher.user.image}
                                  alt={a.teacher.user.name}
                                />
                              ) : (
                                <AvatarFallback>
                                  {a.teacher.user.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                          {conference.authors?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{conference.authors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{conference.mode}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{conference.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {conference.conferenceStartDate
                          ? new Date(
                              conference.conferenceStartDate
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {conference.location || "-"}
                      </TableCell>
                      <TableCell>
                        {conference.registrationFees
                          ? `₹${conference.registrationFees}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {conference.isPublic ? (
                          <>
                          <Eye className="h-4 w-4 text-green-600 inline" />
                          <Badge className="ml-1">Public</Badge>
                          </>
                        ) : (
                          <>
                          <EyeOff className="h-4 w-4 text-gray-400 inline" />
                          <Badge className="ml-1">Private</Badge>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {conference.createdAt
                          ? formatDate(conference.createdAt)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedConference(conference);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteId(conference.id);
                                setIsDeleteOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

          <TablePagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={filters.limit || 10}
            onPageChange={(page) => updateFilter("page", page)}
          />
        </CardContent>
      </Card>

      <ConferenceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        conference={selectedConference}
        onSuccess={fetchConferencesData}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conference entry.
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
            <AlertDialogTitle>
              Delete {selectedIds.length} conference(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMultiDelete}
              className="bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
