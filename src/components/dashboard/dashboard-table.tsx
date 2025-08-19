"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { 
  studentResearchPaperColumns, 
  studentOngoingProjectColumns,
  teacherResearchWorkColumns,
  adminResearchPaperColumns,
  adminOngoingProjectColumns,
  adminAchievementColumns,
  adminUpcomingEventColumns,
  StudentResearchPaper,
  StudentOngoingProject,
  TeacherResearchWork,
  AdminResearchPaper,
  AdminOngoingProject,
  AdminAchievement,
  AdminUpcomingEvent
} from "./table-columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderOpen, Trophy, Calendar, BookOpen } from "lucide-react"
import toast from "react-hot-toast"

interface DashboardTableProps {
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN'
  userId: string
}

export function DashboardTable({ userRole, userId }: DashboardTableProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    researchPapers: StudentResearchPaper[] | AdminResearchPaper[]
    ongoingProjects: StudentOngoingProject[] | AdminOngoingProject[]
    researchWork: TeacherResearchWork[]
    achievements: AdminAchievement[]
    upcomingEvents: AdminUpcomingEvent[]
  }>({
    researchPapers: [],
    ongoingProjects: [],
    researchWork: [],
    achievements: [],
    upcomingEvents: []
  })

  useEffect(() => {
    fetchData()
  }, [userRole, userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (userRole) {
        case 'STUDENT':
          await fetchStudentData()
          break
        case 'TEACHER':
          await fetchTeacherData()
          break
        case 'ADMIN':
          await fetchAdminData()
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentData = async () => {
    const [researchRes, projectsRes] = await Promise.all([
      fetch('/api/student/research-paper'),
      fetch('/api/student/ongoing-projects') // Fixed: changed from ongoing-project to ongoing-projects
    ])

    if (researchRes.ok && projectsRes.ok) {
      const researchData = await researchRes.json()
      const projectsData = await projectsRes.json()
      
      setData(prev => ({
        ...prev,
        researchPapers: researchData.data || [],
        ongoingProjects: projectsData.data || []
      }))
    }
  }

  const fetchTeacherData = async () => {
    const response = await fetch('/api/teacher/research-work')
    
    if (response.ok) {
      const data = await response.json()
      setData(prev => ({
        ...prev,
        researchWork: data.data || []
      }))
    }
  }

  const fetchAdminData = async () => {
    const [researchRes, projectsRes, achievementsRes, competitionsRes] = await Promise.all([
      fetch('/api/admin/research-paper'),
      fetch('/api/admin/ongoing-projects'), // Fixed: changed to ongoing-projects
      fetch('/api/admin/achievement'),
      fetch('/api/admin/upcoming-competition') // Fixed: changed from upcoming-event to upcoming-competition
    ])

    const [researchData, projectsData, achievementsData, competitionsData] = await Promise.all([
      researchRes.ok ? researchRes.json() : { data: [] },
      projectsRes.ok ? projectsRes.json() : { data: [] },
      achievementsRes.ok ? achievementsRes.json() : { data: [] },
      competitionsRes.ok ? competitionsRes.json() : { data: [] }
    ])

    setData(prev => ({
      ...prev,
      researchPapers: researchData.data || [],
      ongoingProjects: projectsData.data || [],
      achievements: achievementsData.data || [],
      upcomingEvents: competitionsData.data || [] // Keep as upcomingEvents for UI consistency
    }))
  }

  // Delete handlers
  const handleDeleteResearchPaper = async (ids: string[]) => {
    const endpoint = userRole === 'STUDENT' ? '/api/student/research-paper' : '/api/admin/research-paper'
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error('Failed to delete research papers')
    }
  }

  const handleDeleteOngoingProject = async (ids: string[]) => {
    const endpoint = userRole === 'STUDENT' ? '/api/student/ongoing-projects' : '/api/admin/ongoing-projects' // Fixed: changed to ongoing-projects
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error('Failed to delete ongoing projects')
    }
  }

  const handleDeleteResearchWork = async (ids: string[]) => {
    const response = await fetch('/api/teacher/research-work', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error('Failed to delete research work')
    }
  }

  const handleDeleteAchievement = async (ids: string[]) => {
    const response = await fetch('/api/admin/achievement', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error('Failed to delete achievements')
    }
  }

  const handleDeleteUpcomingEvent = async (ids: string[]) => {
    const response = await fetch('/api/admin/upcoming-competition', { // Fixed: changed from upcoming-event to upcoming-competition
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error('Failed to delete upcoming competitions')
    }
  }

  // Edit handlers (placeholder - implement based on your edit modal/page logic)
  const handleEdit = (item: any) => {
    // Implement edit functionality
    console.log('Edit item:', item)
    toast('Edit functionality to be implemented', {
      icon: 'ℹ️',
    })
  }

  // View handlers (placeholder - implement based on your view modal/page logic)
  const handleView = (item: any) => {
    // Implement view functionality
    console.log('View item:', item)
    toast('View functionality to be implemented', {
      icon: 'ℹ️',
    })
  }

  if (userRole === 'STUDENT') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Academic Work
          </CardTitle>
          <CardDescription>
            Manage your research papers and ongoing projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="research-papers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="research-papers" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Research Papers
                <Badge variant="secondary">{data.researchPapers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ongoing-projects" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Ongoing Projects
                <Badge variant="secondary">{data.ongoingProjects.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="research-papers" className="mt-6">
              <DataTable
                columns={studentResearchPaperColumns}
                data={data.researchPapers as StudentResearchPaper[]}
                searchKey="title"
                onDelete={handleDeleteResearchPaper}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
            
            <TabsContent value="ongoing-projects" className="mt-6">
              <DataTable
                columns={studentOngoingProjectColumns}
                data={data.ongoingProjects as StudentOngoingProject[]}
                searchKey="title"
                onDelete={handleDeleteOngoingProject}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  if (userRole === 'TEACHER') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Research Work
          </CardTitle>
          <CardDescription>
            Manage your research publications and academic contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={teacherResearchWorkColumns}
            data={data.researchWork}
            searchKey="title"
            onDelete={handleDeleteResearchWork}
            onEdit={handleEdit}
            onView={handleView}
            isLoading={loading}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    )
  }

  if (userRole === 'ADMIN') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Platform Management
          </CardTitle>
          <CardDescription>
            Monitor and manage all platform activities and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="research-papers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="research-papers" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Research Papers
                <Badge variant="secondary" className="text-xs">{data.researchPapers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ongoing-projects" className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Projects
                <Badge variant="secondary" className="text-xs">{data.ongoingProjects.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Achievements
                <Badge variant="secondary" className="text-xs">{data.achievements.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming-events" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Events
                <Badge variant="secondary" className="text-xs">{data.upcomingEvents.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="research-papers" className="mt-6">
              <DataTable
                columns={adminResearchPaperColumns}
                data={data.researchPapers as AdminResearchPaper[]}
                searchKey="title"
                onDelete={handleDeleteResearchPaper}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
            
            <TabsContent value="ongoing-projects" className="mt-6">
              <DataTable
                columns={adminOngoingProjectColumns}
                data={data.ongoingProjects as AdminOngoingProject[]}
                searchKey="title"
                onDelete={handleDeleteOngoingProject}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-6">
              <DataTable
                columns={adminAchievementColumns}
                data={data.achievements}
                searchKey="title"
                onDelete={handleDeleteAchievement}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
            
            <TabsContent value="upcoming-events" className="mt-6">
              <DataTable
                columns={adminUpcomingEventColumns}
                data={data.upcomingEvents}
                searchKey="title"
                onDelete={handleDeleteUpcomingEvent}
                onEdit={handleEdit}
                onView={handleView}
                isLoading={loading}
                userRole={userRole}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return null
}
