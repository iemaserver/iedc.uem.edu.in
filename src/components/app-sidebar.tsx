"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"


import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { DashboardItems } from "@/types/Datatypes"
import { NavMain } from "./nav-main"
import { useSession } from "next-auth/react"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {data:session, status} = useSession()
  if (status === "loading") return (
    <div className="p-4">Loading...</div>
  )
  if (!session) return (
    <div className="p-4">Please log in</div>
  )
  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <NavMain/>
        {/* <NavProjects projects={DashboardItems} /> */}
      </SidebarContent>
       <SidebarFooter>
        <NavUser  session = {session} />
      </SidebarFooter> 
      <SidebarRail />
    </Sidebar>
  )
}
