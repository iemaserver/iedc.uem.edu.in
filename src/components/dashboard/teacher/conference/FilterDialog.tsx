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
  conferenceName?: string;
  mode?: string;
  status?: string;
  location?: string;
  publisher?: string;
  typeOfConference?: string;
  indexOfConference?: string;
  reimbursementStatus?: string;

  // Fee Filters
  registrationFeesMin?: number;
  registrationFeesMax?: number;

  // Date Range Filters
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  conferenceStartAfter?: string;
  conferenceStartBefore?: string;
  conferenceEndAfter?: string;
  conferenceEndBefore?: string;

  // Teacher Filters
  teacherName?: string[];

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
  const [locationInput, setLocationInput] = React.useState("");
  const [publisherInput, setPublisherInput] = React.useState("");

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
      setLocationInput(filters.location || "");
      setPublisherInput(filters.publisher || "");
    }
  }, [open, filters]);

  // Debounce location input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        location: locationInput || undefined,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  // Debounce publisher input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        publisher: publisherInput || undefined,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [publisherInput]);

  // Date handlers - [ADD ALL DATE HANDLERS HERE - PART 1]
  const handleCreatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, createdAfter: value || undefined }));
  };
  const handleCreatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, createdBefore: value || undefined }));
  };
  const handleUpdatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, updatedAfter: value || undefined }));
  };
  const handleUpdatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, updatedBefore: value || undefined }));
  };
  const handleConferenceStartDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceStartAfter: value || undefined,
    }));
  };
  const handleConferenceStartDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceStartBefore: value || undefined,
    }));
  };
  const handleConferenceEndDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceEndAfter: value || undefined,
    }));
  };
  const handleConferenceEndDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceEndBefore: value || undefined,
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
  const clearConferenceStartDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceStartAfter: undefined,
      conferenceStartBefore: undefined,
    }));
  };
  const clearConferenceEndDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      conferenceEndAfter: undefined,
      conferenceEndBefore: undefined,
    }));
  };

  // Basic filter handlers
  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }));
  };
  const handleModeChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      mode: value === "all" ? undefined : value,
    }));
  };
  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }));
  };
  const handleTypeChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      typeOfConference: value === "all" ? undefined : value,
    }));
  };
  const handleIndexChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      indexOfConference: value === "all" ? undefined : value,
    }));
  };
  const handleReimbursementChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      reimbursementStatus: value === "all" ? undefined : value,
    }));
  };
  const handleLocationChange = (value: string) => {
    setLocationInput(value);
  };
  const handlePublisherChange = (value: string) => {
    setPublisherInput(value);
  };

  // Fee handlers
  const handleMinFeeChange = (value: string) => {
    const num = value ? parseFloat(value) : undefined;
    setLocalFilters((prev) => ({ ...prev, registrationFeesMin: num }));
  };
  const handleMaxFeeChange = (value: string) => {
    const num = value ? parseFloat(value) : undefined;
    setLocalFilters((prev) => ({ ...prev, registrationFeesMax: num }));
  };
  const clearFeeRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      registrationFeesMin: undefined,
      registrationFeesMax: undefined,
    }));
  };

  // Teacher filter handlers
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
  const handleRemoveTeacher = (name: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: (prev.teacherName || []).filter((n) => n !== name),
    }));
  };

  const handleApplyFilters = () => {
    const cleanedFilters: Partial<FilterValues> = {};
    Object.entries(localFilters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0) &&
        !["page", "limit", "sortBy", "sortOrder", "all"].includes(key)
      ) {
        cleanedFilters[key as keyof FilterValues] = value as any;
      }
    });
    onFiltersChange(cleanedFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      isPublic: undefined,
      conferenceName: undefined,
      mode: undefined,
      status: undefined,
      location: undefined,
      publisher: undefined,
      typeOfConference: undefined,
      indexOfConference: undefined,
      reimbursementStatus: undefined,
      registrationFeesMin: undefined,
      registrationFeesMax: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      updatedAfter: undefined,
      updatedBefore: undefined,
      conferenceStartAfter: undefined,
      conferenceStartBefore: undefined,
      conferenceEndAfter: undefined,
      conferenceEndBefore: undefined,
      teacherName: undefined,
    };
    setLocalFilters(clearedFilters);
    setLocationInput("");
    setPublisherInput("");
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.isPublic !== undefined) count++;
    if (filters.mode) count++;
    if (filters.status) count++;
    if (filters.location) count++;
    if (filters.publisher) count++;
    if (filters.typeOfConference) count++;
    if (filters.indexOfConference) count++;
    if (filters.reimbursementStatus) count++;
    if (filters.registrationFeesMin || filters.registrationFeesMax) count++;
    if (filters.createdAfter || filters.createdBefore) count++;
    if (filters.updatedAfter || filters.updatedBefore) count++;
    if (filters.conferenceStartAfter || filters.conferenceStartBefore) count++;
    if (filters.conferenceEndAfter || filters.conferenceEndBefore) count++;
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
          Apply multiple filters to narrow down your search results
        </DialogDescription>
      </DialogHeader>

        <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
          </TabsList>

            <TabsContent
              value="basic"
              className="space-y-6 mt-4 overflow-y-auto"
            >
               <ScrollArea
            className="flex-1 pr-4 min-h-0"
            style={{ maxHeight: "60vh" }}
          >
              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Enter location..."
                  value={locationInput}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full"
                />
                {locationInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLocationChange("")}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="publisher" className="text-sm font-semibold">
                  Publisher
                </Label>
                <Input
                  id="publisher"
                  placeholder="Enter publisher name..."
                  value={publisherInput}
                  onChange={(e) => handlePublisherChange(e.target.value)}
                  className="w-full"
                />
                {publisherInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePublisherChange("")}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
              <Separator />
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
                <Label htmlFor="mode" className="text-sm font-semibold">
                  Mode
                </Label>
                <Select
                  value={localFilters.mode || "all"}
                  onValueChange={handleModeChange}
                >
                  <SelectTrigger id="mode" className="w-full">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Status
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
                    <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold">
                  Type
                </Label>
                <Select
                  value={localFilters.typeOfConference || "all"}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="NATIONAL">National</SelectItem>
                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="index" className="text-sm font-semibold">
                  Index
                </Label>
                <Select
                  value={localFilters.indexOfConference || "all"}
                  onValueChange={handleIndexChange}
                >
                  <SelectTrigger id="index" className="w-full">
                    <SelectValue placeholder="Select index" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Indexes</SelectItem>
                    <SelectItem value="SCOPUS">Scopus</SelectItem>
                    <SelectItem value="WOS">Web of Science</SelectItem>
                    <SelectItem value="SCI">SCI</SelectItem>
                    <SelectItem value="UGC">UGC</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label
                  htmlFor="reimbursement"
                  className="text-sm font-semibold"
                >
                  Reimbursement Status
                </Label>
                <Select
                  value={localFilters.reimbursementStatus || "all"}
                  onValueChange={handleReimbursementChange}
                >
                  <SelectTrigger id="reimbursement" className="w-full">
                    <SelectValue placeholder="Select reimbursement status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="APPLIED">Applied</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dates" className="space-y-6 mt-4">
              <ScrollArea>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Conference Start Date Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      type="date"
                      value={localFilters.conferenceStartAfter || ""}
                      onChange={(e) =>
                        handleConferenceStartDateFromChange(e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={localFilters.conferenceStartBefore || ""}
                      onChange={(e) =>
                        handleConferenceStartDateToChange(e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                {(localFilters.conferenceStartAfter ||
                  localFilters.conferenceStartBefore) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearConferenceStartDateRange}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear start date range
                  </Button>
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Conference End Date Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      type="date"
                      value={localFilters.conferenceEndAfter || ""}
                      onChange={(e) =>
                        handleConferenceEndDateFromChange(e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={localFilters.conferenceEndBefore || ""}
                      onChange={(e) =>
                        handleConferenceEndDateToChange(e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                {(localFilters.conferenceEndAfter ||
                  localFilters.conferenceEndBefore) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearConferenceEndDateRange}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear end date range
                  </Button>
                )}
              </div>
              <Separator />
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
                    <Label className="text-xs text-muted-foreground">To</Label>
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
                {(localFilters.createdAfter || localFilters.createdBefore) && (
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
                    <Label className="text-xs text-muted-foreground">To</Label>
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
                {(localFilters.updatedAfter || localFilters.updatedBefore) && (
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
              </ScrollArea>
            </TabsContent>

            <TabsContent value="fees" className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Registration Fees Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Minimum (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localFilters.registrationFeesMin || ""}
                      onChange={(e) => handleMinFeeChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Maximum (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={localFilters.registrationFeesMax || ""}
                      onChange={(e) => handleMaxFeeChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                {(localFilters.registrationFeesMin ||
                  localFilters.registrationFeesMax) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFeeRange}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear fee range
                  </Button>
                )}
              </div>
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p>
                  💡 <strong>Tip:</strong> You can specify just a minimum or
                  maximum value, or both to create a range.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="authors" className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label htmlFor="teacherName" className="text-sm font-semibold">
                  Filter by Author Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="teacherName"
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
                    disabled={!teacherInput.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {localFilters.teacherName &&
                  localFilters.teacherName.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Selected Authors ({localFilters.teacherName.length})
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
                              size="sm"
                              onClick={() => handleRemoveTeacher(name)}
                              className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p>
                    💡 <strong>Tip:</strong> The backend will match partial
                    names. For example, searching "Dr. Smith" will find "Dr.
                    John Smith", "Dr. Jane Smith", etc.
                  </p>
                </div>
              </div>
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
          Apply Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </DialogFooter>
          </DialogContent>
    </Dialog>
  );
}
