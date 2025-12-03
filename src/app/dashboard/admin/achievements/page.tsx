"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, Link as LinkIcon, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

import toast from "react-hot-toast";
import Image from "next/image";
import { AchievementFormDialog } from "@/components/dashboard/AchievementFormDialog";

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/achievement?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.data) {
        setAchievements(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error("Failed to fetch achievements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [page]);

  const handleCreate = () => {
    setSelectedAchievement(null);
    setDialogOpen(true);
  };

  const handleEdit = (achievement: any) => {
    setSelectedAchievement(achievement);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      const response = await fetch(`/api/achievement/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Achievement deleted successfully");
        fetchAchievements();
      } else {
        toast.error("Failed to delete achievement");
      }
    } catch (error) {
      toast.error("Failed to delete achievement");
    }
  };

  const handleTogglePublish = async (achievement: any) => {
    try {
      const response = await fetch(`/api/achievement/${achievement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...achievement,
          isPublished: !achievement.isPublished,
        }),
      });

      if (response.ok) {
        toast.success(
          achievement.isPublished
            ? "Achievement unpublished"
            : "Achievement published"
        );
        fetchAchievements();
      } else {
        toast.error("Failed to update achievement");
      }
    } catch (error) {
      toast.error("Failed to update achievement");
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Achievements</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Achievements</h1>
            <p className="text-muted-foreground">
              Create and manage student and faculty achievements
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Achievements</CardTitle>
            <CardDescription>
              View and manage all achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No achievements found</p>
                <Button onClick={handleCreate} className="mt-4">
                  Create your first achievement
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Achievement Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {achievements.map((achievement) => (
                      <TableRow key={achievement.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {achievement.imageUrl && (
                              <div className="relative h-10 w-10 rounded overflow-hidden">
                                <Image
                                  src={achievement.imageUrl}
                                  alt={achievement.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="font-medium">{achievement.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {achievement.category && (
                            <Badge variant="outline">{achievement.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{achievement.uploadedBy?.name}</div>
                            <div className="text-muted-foreground">
                              {achievement.uploadedBy?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {achievement.achievedAt ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(achievement.achievedAt), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={achievement.isPublished ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleTogglePublish(achievement)}
                          >
                            {achievement.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {achievement.link && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(achievement.link, "_blank")
                                }
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(achievement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(achievement.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AchievementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchAchievements}
        achievement={selectedAchievement}
      />
    </>
  );
}
