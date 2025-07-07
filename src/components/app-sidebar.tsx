"use client"

import * as React from "react"


import { NavMain } from "@/components/nav-main"

import { NavUser } from "@/components/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { User } from "@prisma/client"
import { TeamSwitcher } from "./team-switcher"
import { useSession } from "next-auth/react"


export function AppSidebar({ userData,...props }: { userData: User } & React.ComponentProps<typeof Sidebar>,) {
  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>Loading profile data...</p>
      </div>
    )
  }
  
 
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher name={userData.name} profileImage={userData.profileImage||"/default-image.png"} userType={userData.userType} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain {...userData} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={userData.name} email={userData.email} profileImage={userData.profileImage||"/default-image.png"} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
