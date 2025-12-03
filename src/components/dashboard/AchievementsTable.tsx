"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { AchievementFormDialog } from "./AchievementFormDialog";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Plus, 
  Search,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Calendar,
  Award,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { TablePagination } from "./TablePagination";

export function AchievementsTable() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/achievement");
      const data = await response.json();

      if (data.success) {
        setAchievements(data.data);
      } else {
        toast.error(data.error || "Failed to fetch achievements");
      }
    } catch (error) {
      toast.error("Failed to fetch achievements");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!achievementToDelete) return;

    try {
      const response = await fetch(`/api/achievement/${achievementToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete achievement");
      }

      toast.success("Achievement deleted successfully");
      fetchAchievements();
    } catch (error) {
      toast.error("Failed to delete achievement");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    }
  };

  const handleEdit = (achievement: any) => {
    setSelectedAchievement(achievement);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedAchievement(null);
    setFormDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setAchievementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const togglePublish = async (achievement: any) => {
    try {
      const response = await fetch(`/api/achievement/${achievement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...achievement,
          isPublished: !achievement.isPublished,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update achievement");
      }

      toast.success(
        achievement.isPublished
          ? "Achievement unpublished"
          : "Achievement published"
      );
      fetchAchievements();
    } catch (error) {
      toast.error("Failed to update achievement");
      console.error(error);
    }
  };

  // Filter achievements based on search
  const filteredAchievements = achievements.filter((achievement) =>
    achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    achievement.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    achievement.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredAchievements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAchievements = filteredAchievements.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                My Achievements
              </CardTitle>
              <CardDescription>
                Manage your achievements and accolades
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
              />
            </div>
          </div>

          {currentAchievements.length === 0 ? (
            <div className="text-center py-10">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No achievements found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first achievement"}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAchievements.map((achievement) => (
                      <TableRow key={achievement.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{achievement.title}</div>
                            {achievement.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {achievement.description}
                              </div>
                            )}
                            <div className="flex gap-2 mt-1">
                              {achievement.imageUrl && (
                                <a
                                  href={achievement.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  Image
                                </a>
                              )}
                              {achievement.link && (
                                <a
                                  href={achievement.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Link
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {achievement.category && (
                            <Badge variant="outline">{achievement.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {achievement.achievedAt && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(achievement.achievedAt), "MMM dd, yyyy")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={achievement.isPublished ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => togglePublish(achievement)}
                          >
                            {achievement.isPublished ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(achievement)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => togglePublish(achievement)}
                              >
                                {achievement.isPublished ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(achievement.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAchievements.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AchievementFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setSelectedAchievement(null);
        }}
        onSuccess={fetchAchievements}
        achievement={selectedAchievement}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              achievement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
