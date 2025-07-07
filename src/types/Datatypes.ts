
import { IconDashboard } from "@tabler/icons-react"
import {
  AreaChart,
  BrainCircuit,
  Container,
  Home,
  LucideLayoutDashboard,
  LucidePaperclip,
  Newspaper,
  PartyPopper,
  Search,
  Settings,
  Upload,
  UserIcon,
  UserPen,
  UserPenIcon,
} from "lucide-react"
// This is sample data.


export const DashboardItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: LucideLayoutDashboard,
    isActive: true,
    items: [
      { title: "Home", url: "/",icon:Home },
      { title: "Dashboard", url: "dashboard" ,icon:IconDashboard},
      { title: "Upload Paper", url: "dashboard/paper/upload",icon: Upload },
      { title: "Upload Project", url: "dashboard/paper/project",icon: Upload },
      { title: "My Projects", url: "dashboard/student/projects",icon: Container, access: ["STUDENT"] },
      { title: "Search a Paper", url: "paper",icon: Search },
      { title: "Update profile", url: "dashboard/profile",icon: Settings },
    ],
  },
  {
    title: "Faculty Work Panel",
    url: "#",
    icon: AreaChart,
    access: ["FACULTY"],
    items: [
      { title: "Research Paper ",icon:LucidePaperclip, url: "dashboard/faculty/paper" },
      { title: "Ongoing Project ",icon:Container, url: "dashboard/faculty/project" },
    ],
  },
  {
    title: "Admin Work Panel",
    url: "#",
    icon: BrainCircuit ,
    access: ["ADMIN"],
    items: [
      { title: "Faculty List Work", url: "dashboard/reviewerlist" ,icon:UserPenIcon},
      { title: "Paper Work", url: "dashboard/adminpaperwork" ,icon:PartyPopper},
      { title: "Ongoing Project Work", url: "dashboard/OnGoingProject" ,icon:PartyPopper},
      { title: "Acheivement", url: "dashboard/achievement" ,icon:PartyPopper},
      { title: "User List", url: "dashboard/userlist" ,icon:UserIcon},
    ],
  },
]

