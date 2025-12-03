"use client"

import * as React from "react"
import { FilterIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface FilterValues {
  dateRange?: {
    from?: Date
    to?: Date
  }
  status?: string
  visibility?: string
  authorCount?: string
}

interface FilterDialogProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onClearFilters: () => void
  statusOptions?: { value: string; label: string }[]
  visibilityOptions?: { value: string; label: string }[]
  triggerButton?: React.ReactNode
}

const defaultStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
]

const defaultVisibilityOptions = [
  { value: "all", label: "All Visibility" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "restricted", label: "Restricted" },
]

const authorCountOptions = [
  { value: "all", label: "All Authors" },
  { value: "1", label: "Single Author (1)" },
  { value: "multiple", label: "Multiple Authors (2+)" },
]

export function FilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  statusOptions = defaultStatusOptions,
  visibilityOptions = defaultVisibilityOptions,
  triggerButton,
}: FilterDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<FilterValues>(filters)

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  const handleDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        from: value ? new Date(value) : undefined,
      },
    }))
  }

  const handleDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        to: value ? new Date(value) : undefined,
      },
    }))
  }

  const handleClearDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: undefined,
    }))
  }

  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }))
  }

  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      visibility: value === "all" ? undefined : value,
    }))
  }

  const handleAuthorCountChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      authorCount: value === "all" ? undefined : value,
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      dateRange: undefined,
      status: undefined,
      visibility: undefined,
      authorCount: undefined,
    }
    setLocalFilters(clearedFilters)
    onClearFilters()
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.dateRange?.from || filters.dateRange?.to) count++
    if (filters.status) count++
    if (filters.visibility) count++
    if (filters.authorCount) count++
    return count
  }, [filters])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <FilterIcon className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Options</DialogTitle>
          <DialogDescription>
            Apply filters to refine your search results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  id="date-from"
                  value={localFilters.dateRange?.from ? new Date(localFilters.dateRange.from.getTime() - localFilters.dateRange.from.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ""}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="flex-1"
                  placeholder="From date"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  id="date-to"
                  value={localFilters.dateRange?.to ? new Date(localFilters.dateRange.to.getTime() - localFilters.dateRange.to.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ""}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="flex-1"
                  placeholder="To date"
                />
              </div>
              {(localFilters.dateRange?.from || localFilters.dateRange?.to) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDateRange}
                  className="w-fit"
                >
                  <X className="mr-1 size-3" />
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status" className="w-full">
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
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={localFilters.visibility || "all"}
              onValueChange={handleVisibilityChange}
            >
              <SelectTrigger id="visibility" className="w-full">
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

          {/* Author Count Filter */}
          <div className="space-y-2">
            <Label htmlFor="authorCount">Number of Authors</Label>
            <Select
              value={localFilters.authorCount || "all"}
              onValueChange={handleAuthorCountChange}
            >
              <SelectTrigger id="authorCount" className="w-full">
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

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage filter state
export function useFilters(initialFilters: FilterValues = {}) {
  const [filters, setFilters] = React.useState<FilterValues>(initialFilters)

  const handleFiltersChange = React.useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
  }, [])

  const handleClearFilters = React.useCallback(() => {
    setFilters({
      dateRange: undefined,
      status: undefined,
      visibility: undefined,
      authorCount: undefined,
    })
  }, [])

  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filters.dateRange?.from ||
      filters.dateRange?.to ||
      filters.status ||
      filters.visibility ||
      filters.authorCount
    )
  }, [filters])

  return {
    filters,
    setFilters: handleFiltersChange,
    clearFilters: handleClearFilters,
    hasActiveFilters,
  }
}
