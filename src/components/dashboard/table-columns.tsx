"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, User, FileText, Trophy, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Student Data Types
export interface StudentResearchPaper {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
  updatedAt: Date
  teacherName?: string
  teacherFeedback?: string
}

export interface StudentOngoingProject {
  id: string
  title: string
  description: string
  startDate: Date
  expectedEndDate: Date
  status: 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'ON_HOLD'
  progress: number
  teamMembers: string[]
  mentorName?: string
}

// Teacher Data Types
export interface TeacherResearchWork {
  id: string
  title: string
  description: string
  type: 'RESEARCH_PAPER' | 'BOOK' | 'ARTICLE' | 'CONFERENCE' | 'JOURNAL'
  status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'REJECTED'
  publishedDate?: Date
  venue?: string
  citations: number
  collaborators: string[]
  createdAt: Date
}

// Admin Data Types
export interface AdminResearchPaper {
  id: string
  title: string
  studentName: string
  teacherName: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: Date
  department: string
}

export interface AdminOngoingProject {
  id: string
  title: string
  studentName: string
  mentorName?: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'ON_HOLD'
  startDate: Date
  department: string
  progress: number
}

export interface AdminAchievement {
  id: string
  title: string
  description: string
  achieverName: string
  achieverType: 'STUDENT' | 'TEACHER'
  achievementType: 'ACADEMIC' | 'RESEARCH' | 'COMPETITION' | 'PUBLICATION' | 'AWARD'
  achievedDate: Date
  level: 'COLLEGE' | 'UNIVERSITY' | 'STATE' | 'NATIONAL' | 'INTERNATIONAL'
}

export interface AdminUpcomingEvent {
  id: string
  title: string
  description: string
  eventDate: Date
  venue: string
  eventType: 'WORKSHOP' | 'SEMINAR' | 'CONFERENCE' | 'COMPETITION' | 'HACKATHON'
  maxParticipants: number
  registeredCount: number
  organizer: string
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

// Utility function for sortable header
const createSortableHeader = (label: string, accessor: string) => {
  return ({ column }: { column: any }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold"
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  }
}

// Status badge component
const StatusBadge = ({ status, type = "default" }: { status: string; type?: string }) => {
  const getStatusColor = (status: string, type: string) => {
    if (type === "project") {
      switch (status) {
        case "PLANNING": return "bg-blue-100 text-blue-800"
        case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800"
        case "TESTING": return "bg-purple-100 text-purple-800"
        case "COMPLETED": return "bg-green-100 text-green-800"
        case "ON_HOLD": return "bg-red-100 text-red-800"
        default: return "bg-gray-100 text-gray-800"
      }
    } else if (type === "research") {
      switch (status) {
        case "DRAFT": return "bg-gray-100 text-gray-800"
        case "PENDING": return "bg-yellow-100 text-yellow-800"
        case "SUBMITTED": return "bg-blue-100 text-blue-800"
        case "APPROVED": return "bg-green-100 text-green-800"
        case "PUBLISHED": return "bg-green-100 text-green-800"
        case "REJECTED": return "bg-red-100 text-red-800"
        default: return "bg-gray-100 text-gray-800"
      }
    } else if (type === "event") {
      switch (status) {
        case "DRAFT": return "bg-gray-100 text-gray-800"
        case "PUBLISHED": return "bg-blue-100 text-blue-800"
        case "ONGOING": return "bg-yellow-100 text-yellow-800"
        case "COMPLETED": return "bg-green-100 text-green-800"
        case "CANCELLED": return "bg-red-100 text-red-800"
        default: return "bg-gray-100 text-gray-800"
      }
    }
    return "bg-gray-100 text-gray-800"
  }

  return (
    <Badge className={`${getStatusColor(status, type)} border-0`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

// Student Research Papers Columns
export const studentResearchPaperColumns: ColumnDef<StudentResearchPaper>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[300px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="research" />,
  },
  {
    accessorKey: "teacherName",
    header: "Supervisor",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue("teacherName") || "Not Assigned"}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: createSortableHeader("Created", "createdAt"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy")}
      </div>
    ),
  },
]

// Student Ongoing Projects Columns
export const studentOngoingProjectColumns: ColumnDef<StudentOngoingProject>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Project Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[300px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="project" />,
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: "mentorName",
    header: "Mentor",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue("mentorName") || "Not Assigned"}
      </div>
    ),
  },
  {
    accessorKey: "expectedEndDate",
    header: createSortableHeader("Due Date", "expectedEndDate"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {format(new Date(row.getValue("expectedEndDate")), "MMM dd, yyyy")}
      </div>
    ),
  },
]

// Teacher Research Work Columns
export const teacherResearchWorkColumns: ColumnDef<TeacherResearchWork>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[300px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <StatusBadge status={row.getValue("type")} />,
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="research" />,
  },
  {
    accessorKey: "citations",
    header: createSortableHeader("Citations", "citations"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {row.getValue("citations")}
      </div>
    ),
  },
  {
    accessorKey: "venue",
    header: "Venue/Journal",
    cell: ({ row }) => row.getValue("venue") || "Not specified",
  },
  {
    accessorKey: "publishedDate",
    header: createSortableHeader("Published", "publishedDate"),
    cell: ({ row }) => {
      const date = row.getValue("publishedDate")
      return date ? format(new Date(date as Date), "MMM dd, yyyy") : "Not published"
    },
  },
]

// Admin Research Papers Columns
export const adminResearchPaperColumns: ColumnDef<AdminResearchPaper>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[250px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue("studentName")}
      </div>
    ),
  },
  {
    accessorKey: "teacherName",
    header: "Supervisor",
    cell: ({ row }) => row.getValue("teacherName"),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("department")}</Badge>,
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="research" />,
  },
  {
    accessorKey: "submittedAt",
    header: createSortableHeader("Submitted", "submittedAt"),
    cell: ({ row }) => format(new Date(row.getValue("submittedAt")), "MMM dd, yyyy"),
  },
]

// Admin Ongoing Projects Columns
export const adminOngoingProjectColumns: ColumnDef<AdminOngoingProject>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Project Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[250px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue("studentName")}
      </div>
    ),
  },
  {
    accessorKey: "mentorName",
    header: "Mentor",
    cell: ({ row }) => row.getValue("mentorName") || "Not Assigned",
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("department")}</Badge>,
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="project" />,
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number
      return (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )
    },
  },
]

// Admin Achievements Columns
export const adminAchievementColumns: ColumnDef<AdminAchievement>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Achievement", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[250px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "achieverName",
    header: "Achiever",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue("achieverName")}
      </div>
    ),
  },
  {
    accessorKey: "achieverType",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("achieverType")}</Badge>,
  },
  {
    accessorKey: "achievementType",
    header: "Category",
    cell: ({ row }) => <StatusBadge status={row.getValue("achievementType")} />,
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        {row.getValue("level")}
      </div>
    ),
  },
  {
    accessorKey: "achievedDate",
    header: createSortableHeader("Date", "achievedDate"),
    cell: ({ row }) => format(new Date(row.getValue("achievedDate")), "MMM dd, yyyy"),
  },
]

// Admin Upcoming Events Columns
export const adminUpcomingEventColumns: ColumnDef<AdminUpcomingEvent>[] = [
  {
    accessorKey: "title",
    header: createSortableHeader("Event Title", "title"),
    cell: ({ row }) => (
      <div className="font-medium max-w-[250px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "eventType",
    header: "Type",
    cell: ({ row }) => <StatusBadge status={row.getValue("eventType")} />,
  },
  {
    accessorKey: "eventDate",
    header: createSortableHeader("Date", "eventDate"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {format(new Date(row.getValue("eventDate")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        {row.getValue("venue")}
      </div>
    ),
  },
  {
    accessorKey: "registeredCount",
    header: "Registration",
    cell: ({ row }) => {
      const registered = row.getValue("registeredCount") as number
      const max = row.original.maxParticipants
      return `${registered}/${max}`
    },
  },
  {
    accessorKey: "status",
    header: createSortableHeader("Status", "status"),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} type="event" />,
  },
  {
    accessorKey: "organizer",
    header: "Organizer",
    cell: ({ row }) => row.getValue("organizer"),
  },
]
