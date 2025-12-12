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
  const [investigatorInput, setInvestigatorInput] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Date handlers - Applied Date Range
  const handleAppliedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      appliedAfter: value || undefined,
    }));
  };

  const handleAppliedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      appliedBefore: value || undefined,
    }));
  };

  const clearAppliedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      appliedAfter: undefined,
      appliedBefore: undefined,
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

  // Date handlers - Completed Date Range
  const handleCompletedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      completedAfter: value || undefined,
    }));
  };

  const handleCompletedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      completedBefore: value || undefined,
    }));
  };

  const clearCompletedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      completedAfter: undefined,
      completedBefore: undefined,
    }));
  };

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

  const handleProjectCodeChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      projectCode: value || undefined,
    }));
  };

  const handleProjectPIChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      projectPI: value || undefined,
    }));
  };

  const handleProjectCoPIChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      projectCoPI: value || undefined,
    }));
  };

  // Investigator filter handlers
  const handleAddInvestigator = () => {
    if (investigatorInput.trim()) {
      setLocalFilters((prev) => {
        const currentInvestigators = prev.investigatorName || [];
        if (!currentInvestigators.includes(investigatorInput.trim())) {
          return {
            ...prev,
            investigatorName: [...currentInvestigators, investigatorInput.trim()],
          };
        }
        return prev;
      });
      setInvestigatorInput("");
    }
  };

  const handleRemoveInvestigator = (investigatorName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      investigatorName: prev.investigatorName?.filter((name) => name !== investigatorName),
    }));
  };

  const clearAllInvestigators = () => {
    setLocalFilters((prev) => ({
      ...prev,
      investigatorName: undefined,
    }));
    setInvestigatorInput("");
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      title: undefined,
      isPublic: undefined,
      projectCode: undefined,
      projectPI: undefined,
      projectCoPI: undefined,
      status: undefined,
      appliedAfter: undefined,
      appliedBefore: undefined,
      grantedAfter: undefined,
      grantedBefore: undefined,
      completedAfter: undefined,
      completedBefore: undefined,
      investigatorName: undefined,
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.isPublic !== undefined) count++;
    if (filters.projectCode) count++;
    if (filters.projectPI) count++;
    if (filters.projectCoPI) count++;
    if (filters.status) count++;
    if (filters.appliedAfter || filters.appliedBefore) count++;
    if (filters.grantedAfter || filters.grantedBefore) count++;
    if (filters.completedAfter || filters.completedBefore) count++;
    if (filters.investigatorName && filters.investigatorName.length > 0) count++;
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
            Apply multiple filters to narrow down your grant search results
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Date Ranges</TabsTrigger>
            <TabsTrigger value="investigators">Investigators</TabsTrigger>
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

                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={localFilters.status || "all"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="granted">Granted</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Project Code Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Project Code</Label>
                  <Input
                    placeholder="Enter project code..."
                    value={localFilters.projectCode || ""}
                    onChange={(e) => handleProjectCodeChange(e.target.value)}
                  />
                  {localFilters.projectCode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProjectCodeChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <Separator />

                {/* PI Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Principal Investigator (PI)</Label>
                  <Input
                    placeholder="Enter PI name..."
                    value={localFilters.projectPI || ""}
                    onChange={(e) => handleProjectPIChange(e.target.value)}
                  />
                  {localFilters.projectPI && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProjectPIChange("")}
                      className="h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Co-PI Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Co-Principal Investigator (Co-PI)</Label>
                  <Input
                    placeholder="Enter Co-PI name..."
                    value={localFilters.projectCoPI || ""}
                    onChange={(e) => handleProjectCoPIChange(e.target.value)}
                  />
                  {localFilters.projectCoPI && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProjectCoPIChange("")}
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
                {/* Applied Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Applied Date Range
                    </Label>
                    {(localFilters.appliedAfter || localFilters.appliedBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAppliedDateRange}
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
                        value={localFilters.appliedAfter || ""}
                        onChange={(e) =>
                          handleAppliedDateFromChange(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.appliedBefore || ""}
                        onChange={(e) =>
                          handleAppliedDateToChange(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Granted Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Granted Date Range
                    </Label>
                    {(localFilters.grantedAfter || localFilters.grantedBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearGrantedDateRange}
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
                        value={localFilters.grantedAfter || ""}
                        onChange={(e) =>
                          handleGrantedDateFromChange(e.target.value)
                        }
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
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Completed Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Completed Date Range
                    </Label>
                    {(localFilters.completedAfter || localFilters.completedBefore) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCompletedDateRange}
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
                        value={localFilters.completedAfter || ""}
                        onChange={(e) =>
                          handleCompletedDateFromChange(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        type="date"
                        value={localFilters.completedBefore || ""}
                        onChange={(e) =>
                          handleCompletedDateToChange(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="investigators" className="space-y-6 my-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Investigator Names */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Investigator Names
                    </Label>
                    {localFilters.investigatorName &&
                      localFilters.investigatorName.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllInvestigators}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Clear All
                        </Button>
                      )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter investigator name..."
                      value={investigatorInput}
                      onChange={(e) => setInvestigatorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInvestigator();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddInvestigator}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {localFilters.investigatorName &&
                    localFilters.investigatorName.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <Label className="text-xs text-muted-foreground">
                          Selected Investigators ({localFilters.investigatorName.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {localFilters.investigatorName.map((name) => (
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
                                onClick={() => handleRemoveInvestigator(name)}
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
