"use client";

import * as React from "react";
import { FilterIcon, X, Plus, Trash2, FlipHorizontal, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface FilterValues {
  // Basic Filters
  isPublic?: boolean;
  title?: string;

  // Date Range Filters - Patent specific dates
  filedAfter?: string;
  filedBefore?: string;
  submittedAfter?: string;
  submittedBefore?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  grantedAfter?: string;
  grantedBefore?: string;

  // Standard date filters
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;

  // Teacher/Inventor Filters
  teachersName?: string[];

  // Pagination & Sorting
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  all?: boolean;
}

interface FilterDialogProps {
  filters: FilterValues;
  onFiltersChange: (filters: Partial<FilterValues>) => void;
  onClearFilters: () => void;
  triggerButton?: React.ReactNode;
}

export function FilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  triggerButton,
}: FilterDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterValues>(filters);
  const [teacherInput, setTeacherInput] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Basic filter handlers
  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }));
  };

  // Date handlers - clear functions
  const clearFiledDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      filedAfter: undefined,
      filedBefore: undefined,
    }));
  };

  const clearSubmittedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      submittedAfter: undefined,
      submittedBefore: undefined,
    }));
  };

  const clearPublishedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedAfter: undefined,
      publishedBefore: undefined,
    }));
  };

  const clearGrantedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      grantedAfter: undefined,
      grantedBefore: undefined,
    }));
  };

  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: undefined,
      createdBefore: undefined,
    }));
  };

  const clearUpdatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: undefined,
      updatedBefore: undefined,
    }));
  };

  // Teacher/Inventor filter handlers
  const handleAddTeacher = () => {
    if (teacherInput.trim()) {
      setLocalFilters((prev) => {
        const currentTeachers = prev.teachersName || [];
        if (!currentTeachers.includes(teacherInput.trim())) {
          return {
            ...prev,
            teachersName: [...currentTeachers, teacherInput.trim()],
          };
        }
        return prev;
      });
      setTeacherInput("");
    }
  };

  const handleRemoveTeacher = (teacherName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      teachersName: prev.teachersName?.filter((name) => name !== teacherName),
    }));
  };

  const clearAllTeachers = () => {
    setLocalFilters((prev) => ({
      ...prev,
      teachersName: undefined,
    }));
    setTeacherInput("");
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      isPublic: undefined,
      title: undefined,
      filedAfter: undefined,
      filedBefore: undefined,
      submittedAfter: undefined,
      submittedBefore: undefined,
      publishedAfter: undefined,
      publishedBefore: undefined,
      grantedAfter: undefined,
      grantedBefore: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      updatedAfter: undefined,
      updatedBefore: undefined,
      teachersName: undefined,
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.isPublic !== undefined) count++;
    if (filters.filedAfter || filters.filedBefore) count++;
    if (filters.submittedAfter || filters.submittedBefore) count++;
    if (filters.publishedAfter || filters.publishedBefore) count++;
    if (filters.grantedAfter || filters.grantedBefore) count++;
    if (filters.createdAfter || filters.createdBefore) count++;
    if (filters.updatedAfter || filters.updatedBefore) count++;
    if (filters.teachersName && filters.teachersName.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Filter Patents</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Date Ranges</TabsTrigger>
            <TabsTrigger value="inventors">Inventors</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] pr-4">
            {/* Basic Filters Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <Select
                  value={
                    localFilters.isPublic === undefined
                      ? "all"
                      : localFilters.isPublic
                        ? "public"
                        : "private"
                  }
                  onValueChange={handleVisibilityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Date Ranges Tab */}
            <TabsContent value="dates" className="space-y-4 mt-4">
              {/* Filed Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Filed Date Range</Label>
                  {(localFilters.filedAfter || localFilters.filedBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFiledDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="filed-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="filed-after"
                      type="date"
                      value={localFilters.filedAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          filedAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="filed-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="filed-before"
                      type="date"
                      value={localFilters.filedBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          filedBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Submitted Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Submitted Date Range</Label>
                  {(localFilters.submittedAfter || localFilters.submittedBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSubmittedDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="submitted-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="submitted-after"
                      type="date"
                      value={localFilters.submittedAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          submittedAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="submitted-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="submitted-before"
                      type="date"
                      value={localFilters.submittedBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          submittedBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Published Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Published Date Range</Label>
                  {(localFilters.publishedAfter || localFilters.publishedBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearPublishedDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="published-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="published-after"
                      type="date"
                      value={localFilters.publishedAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          publishedAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="published-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="published-before"
                      type="date"
                      value={localFilters.publishedBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          publishedBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Granted Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Granted Date Range</Label>
                  {(localFilters.grantedAfter || localFilters.grantedBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearGrantedDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="granted-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="granted-after"
                      type="date"
                      value={localFilters.grantedAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          grantedAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="granted-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="granted-before"
                      type="date"
                      value={localFilters.grantedBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          grantedBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Created Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Created Date Range</Label>
                  {(localFilters.createdAfter || localFilters.createdBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCreatedDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="created-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="created-after"
                      type="date"
                      value={localFilters.createdAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          createdAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="created-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="created-before"
                      type="date"
                      value={localFilters.createdBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          createdBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Updated Date Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Updated Date Range</Label>
                  {(localFilters.updatedAfter || localFilters.updatedBefore) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUpdatedDateRange}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="updated-after" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="updated-after"
                      type="date"
                      value={localFilters.updatedAfter || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          updatedAfter: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="updated-before" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="updated-before"
                      type="date"
                      value={localFilters.updatedBefore || ""}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          updatedBefore: e.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Inventors Tab */}
            <TabsContent value="inventors" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Filter by Inventor Names</Label>
                  {localFilters.teachersName && localFilters.teachersName.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllTeachers}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter inventor name"
                    value={teacherInput}
                    onChange={(e) => setTeacherInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTeacher();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTeacher} size="sm">
                    Add
                  </Button>
                </div>
                {localFilters.teachersName && localFilters.teachersName.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {localFilters.teachersName.map((name) => (
                      <Badge key={name} variant="secondary" className="pl-2 pr-1">
                        {name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveTeacher(name)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
