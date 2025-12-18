"use client";

import * as React from "react";
import { FilterIcon, X, Plus, Trash2 } from "lucide-react";

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

  // Date Range Filters - Copyright specific dates
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

  // Pagination & Sorting (handled separately, not in dialog)
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

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Date handlers - Filed Date Range
  const handleFiledDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      filedAfter: value || undefined,
    }));
  };

  const handleFiledDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      filedBefore: value || undefined,
    }));
  };

  const clearFiledDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      filedAfter: undefined,
      filedBefore: undefined,
    }));
  };

  // Date handlers - Submitted Date Range
  const handleSubmittedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      submittedAfter: value || undefined,
    }));
  };

  const handleSubmittedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      submittedBefore: value || undefined,
    }));
  };

  const clearSubmittedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      submittedAfter: undefined,
      submittedBefore: undefined,
    }));
  };

  // Date handlers - Published Date Range
  const handlePublishedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedAfter: value || undefined,
    }));
  };

  const handlePublishedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedBefore: value || undefined,
    }));
  };

  const clearPublishedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      publishedAfter: undefined,
      publishedBefore: undefined,
    }));
  };

  // Date handlers - Granted Date Range
  const handleGrantedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      grantedAfter: value || undefined,
    }));
  };

  const handleGrantedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      grantedBefore: value || undefined,
    }));
  };

  const clearGrantedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      grantedAfter: undefined,
      grantedBefore: undefined,
    }));
  };

  // Date handlers - Created Date Range
  const handleCreatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: value || undefined,
    }));
  };

  const handleCreatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdBefore: value || undefined,
    }));
  };

  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: undefined,
      createdBefore: undefined,
    }));
  };

  // Date handlers - Updated Date Range
  const handleUpdatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: value || undefined,
    }));
  };

  const handleUpdatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedBefore: value || undefined,
    }));
  };

  const clearUpdatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: undefined,
      updatedBefore: undefined,
    }));
  };

  // Basic filter handlers
  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
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
        {triggerButton || (
          <Button variant="outline" className="gap-2 relative">
            <FilterIcon className="h-4 w-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-1 rounded-full px-2 py-0.5 text-xs absolute -top-2 -right-2"
                style={{
                  background:
                    "linear-gradient(to right, var(--first-color), var(--second-color))",
                  color: "white",
                }}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Advanced Filters
          </DialogTitle>
          <DialogDescription>
            Apply multiple filters to narrow down your copyright search results
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Date Ranges</TabsTrigger>
            <TabsTrigger value="inventors">Inventors</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Visibility Filter */}
                <div className="space-y-2">
                  <Label htmlFor="visibility" className="text-sm font-semibold">
                    Visibility
                  </Label>
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
                    <SelectTrigger id="visibility" className="w-full">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visibility</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dates" className="space-y-6 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Filed Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Filed Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.filedAfter || ""}
                        onChange={(e) =>
                          handleFiledDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.filedBefore || ""}
                        onChange={(e) =>
                          handleFiledDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.filedAfter || localFilters.filedBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFiledDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear filed date range
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Submitted Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Submitted Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.submittedAfter || ""}
                        onChange={(e) =>
                          handleSubmittedDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.submittedBefore || ""}
                        onChange={(e) =>
                          handleSubmittedDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.submittedAfter ||
                    localFilters.submittedBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSubmittedDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear submitted date range
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Published Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Published Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.publishedAfter || ""}
                        onChange={(e) =>
                          handlePublishedDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.publishedBefore || ""}
                        onChange={(e) =>
                          handlePublishedDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.publishedAfter ||
                    localFilters.publishedBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearPublishedDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear published date range
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Granted Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Granted Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.grantedAfter || ""}
                        onChange={(e) =>
                          handleGrantedDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.grantedBefore || ""}
                        onChange={(e) =>
                          handleGrantedDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.grantedAfter ||
                    localFilters.grantedBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearGrantedDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear granted date range
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Created Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Created Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.createdAfter || ""}
                        onChange={(e) =>
                          handleCreatedDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.createdBefore || ""}
                        onChange={(e) =>
                          handleCreatedDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.createdAfter ||
                    localFilters.createdBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCreatedDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear created date range
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Updated Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Updated Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.updatedAfter || ""}
                        onChange={(e) =>
                          handleUpdatedDateFromChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.updatedBefore || ""}
                        onChange={(e) =>
                          handleUpdatedDateToChange(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  {(localFilters.updatedAfter ||
                    localFilters.updatedBefore) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearUpdatedDateRange}
                      className="w-fit h-7"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear updated date range
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventors" className="space-y-6 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Teacher/Inventor Name Input */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Filter by Inventor Names
                  </Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Add inventor names to filter. Backend will match partial
                    names.
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter inventor name..."
                      value={teacherInput}
                      onChange={(e) => setTeacherInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTeacher();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTeacher}
                      disabled={!teacherInput.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Selected Inventors */}
                  {localFilters.teachersName &&
                    localFilters.teachersName.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Selected Inventors (
                            {localFilters.teachersName.length})
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAllTeachers}
                            className="h-6 text-xs"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Clear all
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                          {localFilters.teachersName.map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => handleRemoveTeacher(name)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Info Note */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      💡 <strong>Tip:</strong> The backend will match partial
                      names. For example, searching "Dr. Smith" will find "Dr.
                      John Smith", "Dr. Jane Smith", etc.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 mt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear All Filters
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
