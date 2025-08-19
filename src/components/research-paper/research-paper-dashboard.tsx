"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle, XCircle, Upload } from "lucide-react";
import { UploadResearchPaperForm } from "./upload-research-paper-form";
import { ResearchPaperManagement } from "./research-paper-management";
import toast from "react-hot-toast";
import axios from "axios";

interface ResearchPaperStats {
  total: number;
  uploaded: number;
  underReview: number;
  accepted: number;
  rejected: number;
}

interface ResearchPaperDashboardProps {
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
}

export function ResearchPaperDashboard({ userRole }: ResearchPaperDashboardProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ResearchPaperStats>({
    total: 0,
    uploaded: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session, userRole]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      let endpoint = "";
      switch (userRole) {
        case "STUDENT":
          endpoint = "/api/student/research-paper";
          break;
        case "TEACHER":
          endpoint = "/api/teacher/research-paper";
          break;
        case "ADMIN":
          endpoint = "/api/admin/research-paper";
          break;
      }

      const response = await axios.get(endpoint);
      const papers = response.data.data || [];

      // Calculate stats
      const statsData = {
        total: papers.length,
        uploaded: papers.filter((p: any) => p.status === "UPLOADED").length,
        underReview: papers.filter((p: any) => p.status === "UNDER_REVIEW").length,
        accepted: papers.filter((p: any) => p.status === "ACCEPTED").length,
        rejected: papers.filter((p: any) => p.status === "REJECTED").length,
      };

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load research paper statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    setActiveTab("manage");
    fetchStats(); // Refresh stats
    toast.success("Research paper uploaded successfully!");
  };

  const getStatsCards = () => {
    const cards = [
      {
        title: "Total Papers",
        value: stats.total,
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Uploaded",
        value: stats.uploaded,
        icon: Upload,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Under Review",
        value: stats.underReview,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        title: "Accepted",
        value: stats.accepted,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Rejected",
        value: stats.rejected,
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
    ];

    return cards;
  };

  const getWelcomeMessage = () => {
    switch (userRole) {
      case "STUDENT":
        return {
          title: "Research Paper Dashboard",
          description: "Upload your research papers, collaborate with faculty advisors, and track your submission progress.",
        };
      case "TEACHER":
        return {
          title: "Faculty Research Review",
          description: "Review student research papers where you are assigned as a faculty advisor and manage publication decisions.",
        };
      case "ADMIN":
        return {
          title: "Research Administration",
          description: "Oversee all research paper submissions, manage publication workflow, and monitor platform activity.",
        };
      default:
        return {
          title: "Research Dashboard",
          description: "Manage research papers and collaboration.",
        };
    }
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{welcomeMessage.title}</h1>
          <p className="text-muted-foreground mt-2">{welcomeMessage.description}</p>
        </div>
        {userRole === "STUDENT" && (
          <Button onClick={() => setShowUploadForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Research Paper
          </Button>
        )}
      </div>

      {/* Upload Form Modal/Overlay */}
      {showUploadForm && userRole === "STUDENT" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Upload Research Paper</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </Button>
              </div>
              <UploadResearchPaperForm onSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {getStatsCards().map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{isLoading ? "..." : card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">
            {userRole === "STUDENT" ? "My Papers" : "Manage Papers"}
          </TabsTrigger>
          {userRole === "STUDENT" && (
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRole === "STUDENT" && (
                  <Button 
                    onClick={() => setShowUploadForm(true)} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload New Research Paper
                  </Button>
                )}
                <Button 
                  onClick={() => setActiveTab("manage")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Papers
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRole === "STUDENT" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50">1</Badge>
                      <span>Upload your research paper with details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50">2</Badge>
                      <span>Select faculty advisors for collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">3</Badge>
                      <span>Faculty reviews and publishes your work</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gray-50">4</Badge>
                      <span>Published papers cannot be modified</span>
                    </div>
                  </div>
                )}
                {userRole === "TEACHER" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50">1</Badge>
                      <span>Review papers where you're assigned as advisor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50">2</Badge>
                      <span>Provide feedback and guidance to students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">3</Badge>
                      <span>Accept and publish quality research</span>
                    </div>
                  </div>
                )}
                {userRole === "ADMIN" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50">1</Badge>
                      <span>Monitor all research paper submissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50">2</Badge>
                      <span>Oversee publication workflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">3</Badge>
                      <span>Manage platform research activities</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <ResearchPaperManagement userRole={userRole} userId={session?.user?.id || ""} />
        </TabsContent>

        {userRole === "STUDENT" && (
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Research Paper</CardTitle>
                <p className="text-muted-foreground">
                  Fill in the details below to upload your research paper for review.
                </p>
              </CardHeader>
              <CardContent>
                <UploadResearchPaperForm onSuccess={handleUploadSuccess} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
