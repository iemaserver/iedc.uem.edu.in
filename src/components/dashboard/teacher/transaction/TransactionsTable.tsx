"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Search,
  Trash,
  Download,
} from "lucide-react";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { TablePagination } from "../../TablePagination";
import {
  fetchTransactions,
  deleteTransaction,
  deleteMultipleTransactions,
} from "@/lib/api/teacherApi";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exportTransactionsExcel } from "@/lib/csvExport";
import { FilterDialog } from "./FilterDialog";
import type { FilterValues } from "./FilterDialog";

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [titleInput, setTitleInput] = useState<string>("");

  const [filters, setFilters] = useState<FilterValues>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Debounce title input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        title: titleInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [titleInput]);

  // Fetch data whenever filters change
  useEffect(() => {
    fetchTransactionsData();
  }, [filters]);

  const fetchTransactionsData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchTransactions(filters);
      setTransactions(result.data || []);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.total);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    const updates: any = {
      ...{ [key]: value },
    };

    if (key === "page" || key === "limit") {
      if (key === "page") {
        updates.all = false;
      }
    } else {
      updates.page = 1;
    }

    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
      all: false,
    }));
  };

  const clearFilters = () => {
    setTitleInput("");
    setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      all: false,
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction(deleteId);
      fetchTransactionsData();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMultipleTransactions(selectedIds);
      fetchTransactionsData();
      setSelectedIds([]);
      setIsMultiDeleteOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelectAll = () => {
    const allPageIds = transactions.map((t) => t.id);
    const allSelected = allPageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
  ).length;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };



  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <CardTitle
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  background:
                    "linear-gradient(to right, var(--first-color), var(--second-color))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Transactions
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your transaction publications and research papers
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {selectedIds.length > 0 && (
                <Button
                  onClick={() => setIsMultiDeleteOpen(true)}
                  variant="destructive"
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Trash className="h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
              <Button
                onClick={() => exportTransactionsExcel(transactions, "transactions.xlsx")}
                variant="outline"
                className="w-full sm:w-auto gap-2"
                size="sm"
                style={{
                  borderColor: "var(--third-color)",
                  color: "var(--first-color)",
                }}
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button
                onClick={() => {
                  setSelectedTransaction(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />

            <Select
              value={
                filters.isPublic === undefined
                  ? "all"
                  : filters.isPublic
                    ? "public"
                    : "private"
              }
              onValueChange={(value) =>
                updateFilter(
                  "isPublic",
                  value === "all" ? undefined : value === "public"
                )
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] hidden md:flex">
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4 border rounded-md px-3 py-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-records"
                  checked={filters.all || false}
                  onCheckedChange={(checked) =>
                    updateFilter("all", checked === true)
                  }
                />
                <label
                  htmlFor="all-records"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show All Records
                </label>
              </div>
            </div>

            <Select
              value={filters.limit?.toString() || "10"}
              onValueChange={(val) => updateFilter("limit", Number(val))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportTransactionsExcel(transactions.filter(t => selectedIds.includes(t.id)), "selected-transactions.xlsx")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllSelections}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>

          <div className="w-full overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        transactions.length > 0 &&
                        transactions.every((t) => selectedIds.includes(t.id))
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
              <TableHead className="min-w-[250px] sticky left-12 bg-background z-10">Title</TableHead>
              <TableHead className="min-w-[180px]">Transaction Name</TableHead>
              <TableHead className="min-w-[120px]">Impact Factor</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[130px]">Status Date</TableHead>
              <TableHead className="min-w-[120px]">Authors</TableHead>
              <TableHead className="min-w-[100px]">Visibility</TableHead>
              <TableHead className="text-right whitespace-nowrap sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={selectedIds.includes(transaction.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(transaction.id)}
                          onCheckedChange={() => toggleSelectOne(transaction.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.title}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.transactionName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.impactFactor || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge>{transaction.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(transaction.statusDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {transaction.authors?.slice(0, 2).map((author: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {author.teacher?.user?.name || "Author"}
                            </Badge>
                          ))}
                          {transaction.authors?.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{transaction.authors.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.isPublic ? (
                          <Badge variant="default" className="bg-green-600">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteId(transaction.id);
                                setIsDeleteOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <TablePagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={filters.limit || 10}
              onPageChange={(page) => updateFilter("page", page)}
            />
          </div>
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={selectedTransaction}
        onSuccess={fetchTransactionsData}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transaction entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteOpen} onOpenChange={setIsMultiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
