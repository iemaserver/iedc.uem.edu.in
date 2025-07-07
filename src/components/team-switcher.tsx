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
import Image from "next/image"

export function TeamSwitcher({
  name,
  profileImage,
  userType
}: {
  name: string
  profileImage: string
  userType: string
  }
) {
  const { isMobile } = useSidebar()
 

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              
                <Image
                  src={profileImage}
                  alt={name}
                  className="h-7 w-7 rounded-md object-cover"
                    width={100}
                    height={100}
                />
              
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs">{userType}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
      
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
