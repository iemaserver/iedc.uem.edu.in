"use client"

import * as React from "react"
import { FilterIcon, X, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface FilterValues {
  // Basic Filters
  isPublic?: boolean
  title?: string
  offeredBy?: string
  remarks?: string
  
  // Date Range Filters
  createdAfter?: string
  createdBefore?: string
  updatedAfter?: string
  updatedBefore?: string
  completedAfter?: string
  completedBefore?: string
  
  // Teacher Filters
  teacherName?: string[]
  
  // Pagination & Sorting (handled separately, not in dialog)
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  all?: boolean
}

interface FilterDialogProps {
  filters: FilterValues
  onFiltersChange: (filters: Partial<FilterValues>) => void
  onClearFilters: () => void
  triggerButton?: React.ReactNode
}

export function FilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
  triggerButton,
}: FilterDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<FilterValues>(filters)
  const [teacherInput, setTeacherInput] = React.useState("")
  const [offeredByInput, setOfferedByInput] = React.useState("")
  const [remarksInput, setRemarksInput] = React.useState("")

  // Sync local filters with external filters when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters)
      setOfferedByInput(filters.offeredBy || "")
      setRemarksInput(filters.remarks || "")
    }
  }, [open, filters])

  // Debounce offeredBy input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        offeredBy: offeredByInput || undefined,
      }))
    }, 500)

    return () => clearTimeout(timer)
  }, [offeredByInput])

  // Debounce remarks input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({
        ...prev,
        remarks: remarksInput || undefined,
      }))
    }, 500)

    return () => clearTimeout(timer)
  }, [remarksInput])

  // Date handlers
  const handleCreatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: value || undefined,
    }))
  }

  const handleCreatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      createdBefore: value || undefined,
    }))
  }

  const handleUpdatedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: value || undefined,
    }))
  }

  const handleUpdatedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedBefore: value || undefined,
    }))
  }

  const handleCompletedDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      completedAfter: value || undefined,
    }))
  }

  const handleCompletedDateToChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      completedBefore: value || undefined,
    }))
  }

  const clearCreatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      createdAfter: undefined,
      createdBefore: undefined,
    }))
  }

  const clearUpdatedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      updatedAfter: undefined,
      updatedBefore: undefined,
    }))
  }

  const clearCompletedDateRange = () => {
    setLocalFilters((prev) => ({
      ...prev,
      completedAfter: undefined,
      completedBefore: undefined,
    }))
  }

  // Basic filter handlers
  const handleVisibilityChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      isPublic: value === "all" ? undefined : value === "public",
    }))
  }

  const handleOfferedByChange = (value: string) => {
    setOfferedByInput(value)
  }

  const handleRemarksChange = (value: string) => {
    setRemarksInput(value)
  }

  // Teacher filter handlers
  const handleAddTeacher = () => {
    if (teacherInput.trim()) {
      setLocalFilters((prev) => {
        const currentTeachers = prev.teacherName || []
        if (!currentTeachers.includes(teacherInput.trim())) {
          return {
            ...prev,
            teacherName: [...currentTeachers, teacherInput.trim()],
          }
        }
        return prev
      })
      setTeacherInput("")
    }
  }

  const handleRemoveTeacher = (teacherName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: prev.teacherName?.filter((name) => name !== teacherName),
    }))
  }

  const clearAllTeachers = () => {
    setLocalFilters((prev) => ({
      ...prev,
      teacherName: undefined,
    }))
    setTeacherInput("")
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      isPublic: undefined,
      title: undefined,
      offeredBy: undefined,
      remarks: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      updatedAfter: undefined,
      updatedBefore: undefined,
      completedAfter: undefined,
      completedBefore: undefined,
      teacherName: undefined,
    }
    setLocalFilters(clearedFilters)
    setOfferedByInput("")
    setRemarksInput("")
    onClearFilters()
    setOpen(false)
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.isPublic !== undefined) count++
    if (filters.offeredBy) count++
    if (filters.remarks) count++
    if (filters.createdAfter || filters.createdBefore) count++
    if (filters.updatedAfter || filters.updatedBefore) count++
    if (filters.completedAfter || filters.completedBefore) count++
    if (filters.teacherName && filters.teacherName.length > 0) count++
    return count
  }, [filters])

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
                  background: "linear-gradient(to right, var(--first-color), var(--second-color))",
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
          <DialogTitle className="text-xl font-bold">Advanced Filters</DialogTitle>
          <DialogDescription>
            Apply multiple filters to narrow down your search results
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>

            <TabsContent value="basic" className="space-y-6 my-4">
              <ScrollArea>
              {/* Offered By Filter */}
              <div className="space-y-2">
                <Label htmlFor="offeredBy" className="text-sm font-semibold">
                  Offered By
                </Label>
                <Input
                  id="offeredBy"
                  placeholder="Enter organization name..."
                  value={offeredByInput}
                  onChange={(e) => handleOfferedByChange(e.target.value)}
                  className="w-full"
                />
                {offeredByInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOfferedByChange("")}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>

              <Separator />

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

              <Separator />

              {/* Remarks Filter */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-semibold">
                  Remarks
                </Label>
                <Input
                  id="remarks"
                  placeholder="Search remarks..."
                  value={remarksInput}
                  onChange={(e) => handleRemarksChange(e.target.value)}
                  className="w-full"
                />
                {remarksInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemarksChange("")}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>

              </ScrollArea>
            </TabsContent>

            <TabsContent value="dates" className="space-y-6 mt-4">
              {/* Completed Date Range */}
              <ScrollArea>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Completed Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={localFilters.completedAfter || ""}
                      onChange={(e) => handleCompletedDateFromChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={localFilters.completedBefore || ""}
                      onChange={(e) => handleCompletedDateToChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                {(localFilters.completedAfter || localFilters.completedBefore) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCompletedDateRange}
                    className="w-fit h-7"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear completed date range
                  </Button>
                )}
              </div>

              <Separator />

              {/* Created Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Created Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={localFilters.createdAfter || ""}
                      onChange={(e) => handleCreatedDateFromChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={localFilters.createdBefore || ""}
                      onChange={(e) => handleCreatedDateToChange(e.target.value)}
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

              {/* Updated Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Updated Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={localFilters.updatedAfter || ""}
                      onChange={(e) => handleUpdatedDateFromChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={localFilters.updatedBefore || ""}
                      onChange={(e) => handleUpdatedDateToChange(e.target.value)}
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

            <TabsContent value="holders" className="space-y-6 mt-4">
              {/* Teacher Name Input */}
              <ScrollArea>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Filter by Holder Names</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  Add teacher names to filter. Backend will match partial names.
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter teacher name..."
                    value={teacherInput}
                    onChange={(e) => setTeacherInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTeacher()
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

                {/* Selected Teachers */}
                {localFilters.teacherName && localFilters.teacherName.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Selected Teachers ({localFilters.teacherName.length})
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
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> The backend will match partial names. For example, searching "Dr. Smith" will find "Dr. John Smith", "Dr. Jane Smith", etc.
                  </p>
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
  )
}
