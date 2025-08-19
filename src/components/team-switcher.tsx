"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { Avatar } from "@radix-ui/react-avatar"
import { AvatarImage } from "./ui/avatar"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const {data:session} = useSession()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Avatar>
                  <AvatarImage src={session?.user?.image || "/default-avatar.png"} alt="Team Logo" />
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session?.user.fullName}</span>
                <span className="truncate text-xs">{session?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
         
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
