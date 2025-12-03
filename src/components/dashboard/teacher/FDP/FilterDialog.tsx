"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterIcon } from "lucide-react";

interface FilterValues {
  dateRange: { from: string; to: string };
  visibility: string;
  participantCount: string;
}

interface FilterDialogProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  visibilityOptions?: string[];
}

export function FilterDialog({ filters, onFiltersChange, visibilityOptions = ["public", "private"] }: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { dateRange: { from: "", to: "" }, visibility: "all", participantCount: "all" };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const activeCount = [
    localFilters.dateRange.from || localFilters.dateRange.to,
    localFilters.visibility !== "all",
    localFilters.participantCount !== "all",
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filters
          {activeCount > 0 && <Badge variant="secondary" className="ml-1 rounded-full px-1.5">{activeCount}</Badge>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter FDPs</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Input type="date" value={localFilters.dateRange.from} onChange={(e) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, from: e.target.value } })} placeholder="From" />
              <Input type="date" value={localFilters.dateRange.to} onChange={(e) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, to: e.target.value } })} placeholder="To" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={localFilters.visibility} onValueChange={(value) => setLocalFilters({ ...localFilters, visibility: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                {visibilityOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Participant Count</Label>
            <Select value={localFilters.participantCount} onValueChange={(value) => setLocalFilters({ ...localFilters, participantCount: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counts</SelectItem>
                <SelectItem value="1">Single (1)</SelectItem>
                <SelectItem value="2-3">Small (2-3)</SelectItem>
                <SelectItem value="4+">Large (4+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>Clear All</Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
