"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadFile } from "@/lib/appwrite";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { darcula } from "@react-email/components";
import { ca } from "zod/v4/locales";

const achievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z
    .any()
    .refine((file) => !file || file instanceof File, {
      message: "Invalid file type. Please upload an image file.",
    })
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB.",
    })
    .refine((file) => !file || file.type.startsWith("image/"), {
      message: "Only image files are allowed.",
    })
    .optional(),
  category: z.string().min(1, "Category is required"),
  achievementDate: z.string().min(1, "Achievement date is required"),
  link: z.string().url("Invalid URL format").optional(),
  homePageVisibility: z.boolean().optional().default(false),
});

// Define proper type for achievement data
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  link?: string;
  achievementDate: string;
  image?: string;
  homePageVisibility: boolean;
  createdAt: string;
}

export default function AchievementPage() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [uploading, setUploading] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      link: "",
      achievementDate: "",
      image: undefined,
      homePageVisibility: false,
    },
  });

  // Update form
  const updateForm = useForm({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      link: "",
      achievementDate: "",
      image: undefined,
      homePageVisibility: false,
    },
  });

  const fetchAchievements = async () => {
    try {
      const res = await axios.get("/api/user/admin/achievement");
      console.log("Fetched achievements:", res.data);
      setAchievements(res.data);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      toast.error("Failed to fetch achievements");
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const onSubmit = async (data: z.infer<typeof achievementSchema>) => {
    try {
      setUploading(true);
      let imageUrl = null;

      // Upload image to Appwrite if file is selected
      if (data.image && data.image instanceof File) {
        const uploadToast = toast.loading("Uploading image...");
        try {
          imageUrl = await uploadFile(data.image);
          toast.dismiss(uploadToast);
          toast.success("Image uploaded successfully");
        } catch (error) {
          toast.dismiss(uploadToast);
          console.error("Image upload failed:", error);
          toast.error("Failed to upload image");
          return;
        }
      }

      const submitToast = toast.loading("Creating achievement...");
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        link: data.link,
        achievementDate: data.achievementDate,
        image: imageUrl,
      };

      await axios.post("/api/user/admin/achievement", payload);
      toast.dismiss(submitToast);
      toast.success("Achievement created successfully");

      // Reset form and clear file input
      reset();
      const fileInput = document.getElementById("image") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      fetchAchievements();
    } catch (error) {
      console.error("Failed to create achievement:", error);
      toast.error("Failed to create achievement");
    } finally {
      setUploading(false);
    }
  };

  

  // Delete selected achievements
  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );

    if (selectedIds.length === 0) {
      toast.error("Please select achievements to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} achievement(s)?`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const deleteToast = toast.loading("Deleting achievements...");

      await axios.delete("/api/user/admin/achievement", {
        data: { ids: selectedIds },
      });

      toast.dismiss(deleteToast);
      toast.success(
        `${selectedIds.length} achievement(s) deleted successfully`
      );
      setRowSelection({});
      fetchAchievements();
    } catch (error) {
      console.error("Failed to delete achievements:", error);
      toast.error("Failed to delete achievements");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<Achievement>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.original.title;
        return title.length > 30 ? title.slice(0, 30) + "..." : title;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description;
        return description
          ? description.length > 50
            ? description.slice(0, 50) + "..."
            : description
          : "";
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category,
    },
    {
      accessorKey: "achievementDate",
      header: "Achievement Date",
      cell: ({ row }) => {
        try {
          return new Date(row.original.achievementDate).toLocaleDateString();
        } catch (error) {
          return "Invalid date";
        }
      },
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.image;
        return imageUrl ? (
          <img
            src={imageUrl}
            alt="Achievement"
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : (
          <span className="text-gray-500 text-sm">No image</span>
        );
      },
    },

    {
      accessorKey: "homePageVisibility",
      header: "Visible on Home Page",
      cell: ({ row }) => (row.original.homePageVisibility ? "Yes" : "No"),
    },
    {
      accessorKey: "link",
      header: "Link",
      cell: ({ row }) => {
        const link = row.original.link;
        return link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {link.length > 30 ? link.slice(0, 30) + "..." : link}
          </a>
        ) : (
          <span className="text-gray-500 text-sm">No link</span>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const achievement = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    console.log(
                      "Toggling home page visibility for achievement:",
                      achievement.id,
                      !achievement.homePageVisibility
                    );
                    await axios.put(`/api/user/admin/achievement`, {
                      homePageVisibility: !achievement.homePageVisibility,
                      achievementId: achievement.id,
                    });

                    toast.success(
                      `Achievement visibility updated successfully`
                    );
                  } catch (error) {
                    console.error(
                      "Failed to update achievement visibility:",
                      error
                    );
                    toast.error("Failed to update achievement visibility");
                  } finally {
                    fetchAchievements();
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                toggle Home Page Visibility
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  if (
                    confirm("Are you sure you want to delete this achievement?")
                  ) {
                    try {
                      setDeleting(true);
                      const deleteToast = toast.loading(
                        "Deleting achievement..."
                      );

                      await axios.delete(`/api/user/admin/achievement`, {
                        data: { ids: [achievement.id] },
                      });

                      toast.dismiss(deleteToast);
                      toast.success("Achievement deleted successfully");
                      fetchAchievements();
                    } catch (error) {
                      console.error("Failed to delete achievement:", error);
                      toast.error("Failed to delete achievement");
                    } finally {
                      setDeleting(false);
                    }
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: achievements,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col  gap-5 w-full min-h-full px-5 pb-5 ">
      {/* Form Section */}
      <div className="w-full shadow shadow-black rounded-md p-5 space-y-4">
        <h2 className="text-xl font-semibold">Add Achievement</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input placeholder="Title" {...register("title")} />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}

          <Textarea placeholder="Description" {...register("description")} />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}

          <Input placeholder="Category" {...register("category")} />
          {errors.category && (
            <p className="text-red-500 text-sm">{errors.category.message}</p>
          )}
          <Input
            placeholder="Achievement Date"
            type="date"
            {...register("achievementDate")}
          />
          {errors.achievementDate && (
            <p className="text-red-500 text-sm">
              {errors.achievementDate.message}
            </p>
          )}

          <Input placeholder="Link" {...register("link")} />
          {errors.link && (
            <p className="text-red-500 text-sm">{errors.link.message}</p>
          )}
          <div className="space-y-2">
            <label htmlFor="image" className="block text-sm font-medium">
              Achievement Image (optional)
            </label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File size must be less than 5MB");
                    e.target.value = "";
                    return;
                  }

                  // Validate file type
                  if (!file.type.startsWith("image/")) {
                    toast.error("Only image files are allowed");
                    e.target.value = "";
                    return;
                  }

                  setValue("image", file, { shouldValidate: true });
                } else {
                  setValue("image", undefined);
                }
              }}
            />
            {errors.image && (
              <p className="text-red-500 text-sm">
                {String(errors.image.message)}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting || uploading}>
            {uploading
              ? "Uploading..."
              : isSubmitting
                ? "Submitting..."
                : "Submit"}
          </Button>
        </form>
      </div>

      {/* Table Section */}
      <div className="w-full shadow shadow-black rounded-md p-5">
        <h2 className="text-xl font-semibold mb-4">Achievements</h2>

        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder="Search by title..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />

          <div className="flex items-center gap-2">
            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Settings className="mr-2 h-4 w-4" />
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Selected Button */}
            {Object.keys(rowSelection).length > 0 && (
              <Button
                variant="destructive"
                onClick={deleteSelected}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting
                  ? "Deleting..."
                  : `Delete ${Object.keys(rowSelection).length} selected`}
              </Button>
            )}
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-md border overflow-x-auto">
              <Table className="table-auto w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="cursor-pointer"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{ asc: " ↑", desc: " ↓" }[
                            header.column.getIsSorted() as string
                          ] ?? null}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
