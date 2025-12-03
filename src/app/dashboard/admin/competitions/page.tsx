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
import { Plus, Calendar, MapPin, Link as LinkIcon, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

import toast from "react-hot-toast";
import { CompetitionFormDialog } from "@/components/dashboard/CompetitionFormDialog";

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/competition?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.data) {
        setCompetitions(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error("Failed to fetch competitions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, [page]);

  const handleCreate = () => {
    setSelectedCompetition(null);
    setDialogOpen(true);
  };

  const handleEdit = (competition: any) => {
    setSelectedCompetition(competition);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competition?")) return;

    try {
      const response = await fetch(`/api/competition/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Competition deleted successfully");
        fetchCompetitions();
      } else {
        toast.error("Failed to delete competition");
      }
    } catch (error) {
      toast.error("Failed to delete competition");
    }
  };

  const handleTogglePublish = async (competition: any) => {
    try {
      const response = await fetch(`/api/competition/${competition.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...competition,
          isPublished: !competition.isPublished,
        }),
      });

      if (response.ok) {
        toast.success(
          competition.isPublished
            ? "Competition unpublished"
            : "Competition published"
        );
        fetchCompetitions();
      } else {
        toast.error("Failed to update competition");
      }
    } catch (error) {
      toast.error("Failed to update competition");
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
              <BreadcrumbPage>Competitions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Competitions</h1>
            <p className="text-muted-foreground">
              Create and manage upcoming competitions
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competition
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Competitions</CardTitle>
            <CardDescription>
              View and manage all upcoming competitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : competitions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No competitions found</p>
                <Button onClick={handleCreate} className="mt-4">
                  Create your first competition
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Location/Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitions.map((competition) => (
                      <TableRow key={competition.id}>
                        <TableCell className="font-medium">
                          {competition.title}
                        </TableCell>
                        <TableCell>
                          {competition.category && (
                            <Badge variant="outline">{competition.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(competition.startDate), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {competition.mode ? (
                              <Badge variant="secondary">{competition.mode}</Badge>
                            ) : (
                              competition.location && (
                                <>
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {competition.location.substring(0, 20)}
                                    {competition.location.length > 20 ? "..." : ""}
                                  </span>
                                </>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={competition.isPublished ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleTogglePublish(competition)}
                          >
                            {competition.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {competition.websiteUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(competition.websiteUrl, "_blank")
                                }
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(competition)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(competition.id)}
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

      <CompetitionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCompetitions}
        competition={selectedCompetition}
      />
    </>
  );
}
