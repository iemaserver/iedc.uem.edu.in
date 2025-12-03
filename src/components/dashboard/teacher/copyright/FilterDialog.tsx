"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Filter } from "lucide-react";

interface FilterValues {
  dateRange: { from: string; to: string };
  visibility: string;
  inventorCount: string;
  status: string;
}

interface FilterDialogProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  visibilityOptions: string[];
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: { from: "", to: "" },
    visibility: "all",
    inventorCount: "all",
    status: "all",
  });

  return { filters, setFilters };
}

export function FilterDialog({ filters, onFiltersChange, visibilityOptions }: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: { from: "", to: "" },
      visibility: "all",
      inventorCount: "all",
      status: "all",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = [
    localFilters.dateRange.from || localFilters.dateRange.to,
    localFilters.visibility !== "all",
    localFilters.inventorCount !== "all",
    localFilters.status !== "all",
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Copyrights</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date Range (Filed/Granted)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={localFilters.dateRange.from} onChange={(e) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, from: e.target.value } })} placeholder="From" />
              <Input type="date" value={localFilters.dateRange.to} onChange={(e) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, to: e.target.value } })} placeholder="To" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={localFilters.status} onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="granted">Granted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={localFilters.visibility} onValueChange={(value) => setLocalFilters({ ...localFilters, visibility: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option === "public" ? "Public" : "Private"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Inventors</Label>
            <Select value={localFilters.inventorCount} onValueChange={(value) => setLocalFilters({ ...localFilters, inventorCount: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">1 Inventor</SelectItem>
                <SelectItem value="2-3">2-3 Inventors</SelectItem>
                <SelectItem value="4+">4+ Inventors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">Reset</Button>
            <Button onClick={handleApply} className="flex-1">Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
