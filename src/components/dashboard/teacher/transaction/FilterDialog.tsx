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
  transactionName?: string;
  publisher?: string;
  status?: string;

  // Date Range Filters
  statusAfter?: string;
  statusBefore?: string;
  impactFactorAfter?: string;
  impactFactorBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;

  // Teacher/Author Filters
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

  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }));
  };

  // Date handlers - Status Date
  const clearStatusDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      statusAfter: undefined,
      statusBefore: undefined,
    }));
  };

  // Date handlers - Impact Factor Date
  const clearImpactFactorDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      impactFactorAfter: undefined,
      impactFactorBefore: undefined,
    }));
  };

  // Date handlers - Created Date
  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: undefined,
      createdBefore: undefined,
    }));
  };

  // Date handlers - Updated Date
  const clearUpdatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: undefined,
      updatedBefore: undefined,
    }));
  };

  // Teacher filter handlers
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
      transactionName: undefined,
      publisher: undefined,
      status: undefined,
      statusAfter: undefined,
      statusBefore: undefined,
      impactFactorAfter: undefined,
      impactFactorBefore: undefined,
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
    if (filters.status !== undefined) count++;
    if (filters.statusAfter || filters.statusBefore) count++;
    if (filters.impactFactorAfter || filters.impactFactorBefore) count++;
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
            Apply multiple filters to narrow down your transaction search results
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Date Ranges</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
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

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Publication Status
                  </Label>
                  <Select
                    value={localFilters.status || "all"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dates" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Status Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Status Date</Label>
                    {(localFilters.statusAfter || localFilters.statusBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearStatusDateRange}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="statusAfter" className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="statusAfter"
                        type="date"
                        value={localFilters.statusAfter || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            statusAfter: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="statusBefore" className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="statusBefore"
                        type="date"
                        value={localFilters.statusBefore || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            statusBefore: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Impact Factor Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Impact Factor Date</Label>
                    {(localFilters.impactFactorAfter ||
                      localFilters.impactFactorBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImpactFactorDateRange}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="impactFactorAfter"
                        className="text-xs text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="impactFactorAfter"
                        type="date"
                        value={localFilters.impactFactorAfter || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            impactFactorAfter: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="impactFactorBefore"
                        className="text-xs text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="impactFactorBefore"
                        type="date"
                        value={localFilters.impactFactorBefore || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            impactFactorBefore: e.target.value || undefined,
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
                    <Label className="text-sm font-semibold">Created Date</Label>
                    {(localFilters.createdAfter || localFilters.createdBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCreatedDateRange}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="createdAfter"
                        className="text-xs text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="createdAfter"
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
                    <div className="space-y-1">
                      <Label
                        htmlFor="createdBefore"
                        className="text-xs text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="createdBefore"
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
                    <Label className="text-sm font-semibold">Updated Date</Label>
                    {(localFilters.updatedAfter || localFilters.updatedBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearUpdatedDateRange}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="updatedAfter"
                        className="text-xs text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="updatedAfter"
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
                    <div className="space-y-1">
                      <Label
                        htmlFor="updatedBefore"
                        className="text-xs text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="updatedBefore"
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
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="authors" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Filter by Author Names
                    </Label>
                    {localFilters.teachersName &&
                      localFilters.teachersName.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllTeachers}
                          className="h-8 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter author name..."
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
                      size="sm"
                      disabled={!teacherInput.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {localFilters.teachersName &&
                  localFilters.teachersName.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Added Authors ({localFilters.teachersName.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {localFilters.teachersName.map((teacher, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 flex items-center gap-2"
                          >
                            {teacher}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleRemoveTeacher(teacher)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
