"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Search,
  Loader2,
  Trophy,
  Clock,
  Link as LinkIcon,
  Users,
  Globe,
} from "lucide-react";
import { format, isPast, isFuture, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Separator } from "@/components/ui/separator";

export function CompetitionsListView() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/competition");
      const data = await response.json();

      if (data.success) {
        setCompetitions(data.data);
      } else {
        toast.error(data.error || "Failed to fetch competitions");
      }
    } catch (error) {
      toast.error("Failed to fetch competitions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter competitions
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.organizer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = filterMode === "all" || comp.mode === filterMode;

    let matchesStatus = true;
    if (filterStatus === "upcoming") {
      matchesStatus = isFuture(parseISO(comp.startDate));
    } else if (filterStatus === "ongoing") {
      const now = new Date();
      const start = parseISO(comp.startDate);
      const end = comp.endDate ? parseISO(comp.endDate) : start;
      matchesStatus = now >= start && now <= end;
    } else if (filterStatus === "past") {
      matchesStatus = comp.endDate
        ? isPast(parseISO(comp.endDate))
        : isPast(parseISO(comp.startDate));
    }

    return matchesSearch && matchesMode && matchesStatus && comp.isPublished;
  });

  // Sort by start date
  const sortedCompetitions = [...filteredCompetitions].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const getCompetitionStatus = (competition: any) => {
    const now = new Date();
    const start = parseISO(competition.startDate);
    const end = competition.endDate ? parseISO(competition.endDate) : start;

    if (now < start) return "upcoming";
    if (now > end) return "past";
    return "ongoing";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
      case "ongoing":
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Ongoing</Badge>;
      case "past":
        return <Badge variant="secondary">Past</Badge>;
      default:
        return null;
    }
  };

  const getModeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      Online: "bg-purple-50 text-purple-700 border-purple-200",
      Offline: "bg-orange-50 text-orange-700 border-orange-200",
      Hybrid: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };

    return (
      <Badge variant="outline" className={colors[mode] || ""}>
        {mode}
      </Badge>
    );
  };

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
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitions</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Competitions List */}
      {sortedCompetitions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No competitions found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterMode !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "No competitions available at the moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedCompetitions.map((competition) => {
            const status = getCompetitionStatus(competition);
            const isRegistrationOpen = competition.registrationDeadline
              ? isFuture(parseISO(competition.registrationDeadline))
              : true;

            return (
              <Card key={competition.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(status)}
                        {competition.mode && getModeBadge(competition.mode)}
                        {competition.category && (
                          <Badge variant="outline">{competition.category}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{competition.title}</CardTitle>
                      {competition.organizer && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          Organized by {competition.organizer}
                        </CardDescription>
                      )}
                    </div>
                    <Trophy className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competition.description && (
                    <p className="text-sm text-muted-foreground">
                      {competition.description}
                    </p>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Event Date</p>
                        <p className="text-muted-foreground">
                          {format(parseISO(competition.startDate), "MMM dd, yyyy")}
                          {competition.endDate &&
                            ` - ${format(parseISO(competition.endDate), "MMM dd, yyyy")}`}
                        </p>
                      </div>
                    </div>

                    {competition.registrationDeadline && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Registration Deadline</p>
                          <p className={isRegistrationOpen ? "text-green-600" : "text-red-600"}>
                            {format(parseISO(competition.registrationDeadline), "MMM dd, yyyy")}
                            {isRegistrationOpen ? " (Open)" : " (Closed)"}
                          </p>
                        </div>
                      </div>
                    )}

                    {competition.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground">{competition.location}</p>
                        </div>
                      </div>
                    )}

                    {competition.prizeDetails && (
                      <div className="flex items-start gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Prizes</p>
                          <p className="text-muted-foreground">{competition.prizeDetails}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {competition.eligibilityCriteria && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Eligibility Criteria</p>
                        <p className="text-muted-foreground">
                          {competition.eligibilityCriteria}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    {competition.registrationLink && isRegistrationOpen && (
                      <Button asChild size="sm">
                        <a
                          href={competition.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Register Now
                        </a>
                      </Button>
                    )}
                    {competition.websiteUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={competition.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                    {competition.posterUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={competition.posterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Poster
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
