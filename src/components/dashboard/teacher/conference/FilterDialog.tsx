"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface FilterValues {
  dateRange?: { from: Date; to: Date };
  status?: string;
  visibility?: string;
  authorCount?: string;
  mode?: string;
}

interface FilterDialogProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  statusOptions: { value: string; label: string }[];
  visibilityOptions: { value: string; label: string }[];
  modeOptions: { value: string; label: string }[];
}

export function FilterDialog({ filters, onFiltersChange, onClearFilters, statusOptions, visibilityOptions, modeOptions }: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = [
    filters.dateRange,
    filters.status && filters.status !== "all",
    filters.visibility && filters.visibility !== "all",
    filters.authorCount && filters.authorCount !== "all",
    filters.mode && filters.mode !== "all",
  ].filter(Boolean).length;

  const authorCountOptions = [
    { value: "all", label: "All Authors" },
    { value: "1", label: "Single Author" },
    { value: "multiple", label: "Multiple Authors" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Conferences</DialogTitle>
          <DialogDescription>Apply filters to narrow down your conference list</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Conference Date Range</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={localFilters.dateRange?.from ? localFilters.dateRange.from.toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                    setLocalFilters({
                      ...localFilters,
                      dateRange: fromDate ? {
                        from: fromDate,
                        to: localFilters.dateRange?.to || new Date()
                      } : undefined
                    });
                  }}
                  placeholder="From date"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={localFilters.dateRange?.to ? localFilters.dateRange.to.toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const toDate = e.target.value ? new Date(e.target.value) : undefined;
                    setLocalFilters({
                      ...localFilters,
                      dateRange: toDate ? {
                        from: localFilters.dateRange?.from || new Date(),
                        to: toDate
                      } : undefined
                    });
                  }}
                  placeholder="To date"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={localFilters.visibility || "all"}
              onValueChange={(value) => setLocalFilters({ ...localFilters, visibility: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Filter */}
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={localFilters.mode || "all"}
              onValueChange={(value) => setLocalFilters({ ...localFilters, mode: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Author Count Filter */}
          <div className="space-y-2">
            <Label>Number of Authors</Label>
            <Select
              value={localFilters.authorCount || "all"}
              onValueChange={(value) => setLocalFilters({ ...localFilters, authorCount: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select author count" />
              </SelectTrigger>
              <SelectContent>
                {authorCountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterValues>({});

  const clearFilters = () => {
    setFilters({});
  };

  return { filters, setFilters, clearFilters };
}
