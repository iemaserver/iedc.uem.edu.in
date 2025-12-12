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
  page?: number;
  limit?: number;
  all?: boolean;
  name?: string;
  isPublic?: boolean;
  organizedBy?: string;
  sponsoredBy?: string;
  topic?: string;
  venue?: string;
  duration?: string;
  certificateUrl?: string;
  remarks?: string;

  // Date Range Filters
  startDate?: string;
  startAfter?: string;
  startBefore?: string;
  endDate?: string;
  endAfter?: string;
  endBefore?: string;

  // Teacher/Participant Filters
  teacherName?: string[];

  // Pagination & Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

  // Date handlers - Start Date Range
  const handleStartDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      startAfter: value || undefined,
    }));
  };

  const handleStartDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      startBefore: value || undefined,
    }));
  };

  const clearStartDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      startAfter: undefined,
      startBefore: undefined,
    }));
  };

  // Date handlers - End Date Range
  const handleEndDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      endAfter: value || undefined,
    }));
  };

  const handleEndDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      endBefore: value || undefined,
    }));
  };

  const clearEndDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      endAfter: undefined,
      endBefore: undefined,
    }));
  };

  // Basic filter handlers
  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }));
  };

  const handleOrganizedByChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      organizedBy: value || undefined,
    }));
  };

  const handleSponsoredByChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      sponsoredBy: value || undefined,
    }));
  };

  const handleTopicChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      topic: value || undefined,
    }));
  };

  const handleVenueChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      venue: value || undefined,
    }));
  };

  // Teacher/Participant filter handlers
  const handleAddTeacher = () => {
    if (teacherInput.trim()) {
      setLocalFilters((prev) => {
        const currentTeachers = prev.teacherName || [];
        if (!currentTeachers.includes(teacherInput.trim())) {
          return {
            ...prev,
            teacherName: [...currentTeachers, teacherInput.trim()],
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
      teacherName: prev.teacherName?.filter((name) => name !== teacherName),
    }));
  };

  const clearAllTeachers = () => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: undefined,
    }));
    setTeacherInput("");
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      name: undefined,
      isPublic: undefined,
      organizedBy: undefined,
      sponsoredBy: undefined,
      topic: undefined,
      venue: undefined,
      duration: undefined,
      startAfter: undefined,
      startBefore: undefined,
      endAfter: undefined,
      endBefore: undefined,
      teacherName: undefined,
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.isPublic !== undefined) count++;
    if (filters.organizedBy) count++;
    if (filters.sponsoredBy) count++;
    if (filters.topic) count++;
    if (filters.venue) count++;
    if (filters.startAfter || filters.startBefore) count++;
    if (filters.endAfter || filters.endBefore) count++;
    if (filters.teacherName && filters.teacherName.length > 0) count++;
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
            Apply multiple filters to narrow down your FDP search results
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Date Ranges</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Visibility Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Visibility</Label>
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

                <Separator />

                {/* Organized By Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Organized By</Label>
                  <Input
                    placeholder="Enter organization name..."
                    value={localFilters.organizedBy || ""}
                    onChange={(e) => handleOrganizedByChange(e.target.value)}
                  />
                  {localFilters.organizedBy && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrganizedByChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Sponsored By Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sponsored By</Label>
                  <Input
                    placeholder="Enter sponsor name..."
                    value={localFilters.sponsoredBy || ""}
                    onChange={(e) => handleSponsoredByChange(e.target.value)}
                  />
                  {localFilters.sponsoredBy && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSponsoredByChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Topic Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Topic</Label>
                  <Input
                    placeholder="Enter topic..."
                    value={localFilters.topic || ""}
                    onChange={(e) => handleTopicChange(e.target.value)}
                  />
                  {localFilters.topic && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTopicChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Venue Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Venue</Label>
                  <Input
                    placeholder="Enter venue..."
                    value={localFilters.venue || ""}
                    onChange={(e) => handleVenueChange(e.target.value)}
                  />
                  {localFilters.venue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVenueChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dates" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Start Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Start Date Range
                    </Label>
                    {(localFilters.startAfter || localFilters.startBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearStartDateRange}
                        className="h-7 text-xs"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.startAfter || ""}
                        onChange={(e) =>
                          handleStartDateFromChange(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.startBefore || ""}
                        onChange={(e) =>
                          handleStartDateToChange(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* End Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      End Date Range
                    </Label>
                    {(localFilters.endAfter || localFilters.endBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearEndDateRange}
                        className="h-7 text-xs"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.endAfter || ""}
                        onChange={(e) => handleEndDateFromChange(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.endBefore || ""}
                        onChange={(e) => handleEndDateToChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Teacher/Participant Names */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Participant Names
                    </Label>
                    {localFilters.teacherName &&
                      localFilters.teacherName.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllTeachers}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Clear All
                        </Button>
                      )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter participant name..."
                      value={teacherInput}
                      onChange={(e) => setTeacherInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTeacher();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTeacher}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {localFilters.teacherName &&
                    localFilters.teacherName.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <Label className="text-xs text-muted-foreground">
                          Selected Participants ({localFilters.teacherName.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {localFilters.teacherName.map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
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
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
          <Button onClick={handleApplyFilters}>
            <FilterIcon className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
