"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderPlus, 
  Settings, 
  Users, 
  BarChart3, 
  Upload,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { UploadOngoingProjectForm } from "./upload-ongoing-project-form";
import { OngoingProjectManagement } from "./ongoing-project-management";

interface OngoingProjectDashboardProps {
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
}

export function OngoingProjectDashboard({ userRole }: OngoingProjectDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");

  const getRoleBasedTabs = () => {
    const baseTabs = [
      { value: "overview", label: "Overview", icon: BarChart3 },
      { value: "manage", label: "Manage Projects", icon: Settings },
    ];

    if (userRole === "STUDENT") {
      baseTabs.splice(1, 0, { value: "upload", label: "Upload Project", icon: Upload });
    }

    return baseTabs;
  };

  const getStatsForRole = () => {
    switch (userRole) {
      case "STUDENT":
        return [
          {
            title: "My Projects",
            description: "Total ongoing projects",
            icon: FolderPlus,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
          },
          {
            title: "Completed",
            description: "Successfully completed projects",
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          {
            title: "In Progress",
            description: "Currently ongoing projects",
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
          },
          {
            title: "Collaborations",
            description: "Projects with team members",
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
          }
        ];
      case "TEACHER":
        return [
          {
            title: "Advised Projects",
            description: "Projects under guidance",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
          },
          {
            title: "Completed",
            description: "Successfully completed projects",
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          {
            title: "Ongoing",
            description: "Currently active projects",
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
          },
          {
            title: "Students",
            description: "Unique students guided",
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
          }
        ];
      case "ADMIN":
        return [
          {
            title: "Total Projects",
            description: "All ongoing projects",
            icon: FolderPlus,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
          },
          {
            title: "Active Students",
            description: "Students with projects",
            icon: Users,
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          {
            title: "Faculty Involved",
            description: "Teachers advising projects",
            icon: TrendingUp,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
          },
          {
            title: "Completion Rate",
            description: "Projects completion ratio",
            icon: BarChart3,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
          }
        ];
      default:
        return [];
    }
  };

  const tabs = getRoleBasedTabs();
  const stats = getStatsForRole();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ongoing Projects</h1>
          <p className="text-muted-foreground">
            {userRole === "STUDENT" && "Manage and track your ongoing projects"}
            {userRole === "TEACHER" && "Guide and monitor student projects"}
            {userRole === "ADMIN" && "Oversee all ongoing projects in the institution"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role-specific overview content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === "STUDENT" && (
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab("upload")}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Project
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab("manage")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage My Projects
                    </Button>
                  </div>
                )}
                {userRole === "TEACHER" && (
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab("manage")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Review Student Projects
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                )}
                {userRole === "ADMIN" && (
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab("manage")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage All Projects
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Institution Analytics
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRole === "STUDENT" && (
                    <div className="text-center text-muted-foreground py-8">
                      <FolderPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Upload your first ongoing project to get started</p>
                    </div>
                  )}
                  {userRole === "TEACHER" && (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Students will appear here when they add you as advisor</p>
                    </div>
                  )}
                  {userRole === "ADMIN" && (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <span>Monitor all ongoing project activities</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <OngoingProjectManagement userRole={userRole} userId={session?.user?.id || ""} />
        </TabsContent>

        {userRole === "STUDENT" && (
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Ongoing Project</CardTitle>
                <p className="text-muted-foreground">
                  Fill in the details below to upload your ongoing project for tracking and collaboration.
                </p>
              </CardHeader>
              <CardContent>
                <UploadOngoingProjectForm 
                  onSuccess={() => {
                    setActiveTab("manage");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
