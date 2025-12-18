"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { DashboardItems } from "@/types/Datatypes";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "STUDENT";
  console.log("User Role in Sidebar:", userRole);
  // Map TEACHER role to FACULTY for UI purposes
  const displayRole = userRole === "TEACHER" ? "FACULTY" : userRole;

  // Filter dashboard items based on user role
  const filteredItems = DashboardItems.map((section) => {
    // If section has access restrictions, check if user has access
    if (section.access && !section.access.includes(displayRole as any)) {
      return null;
    }

    // Filter items within the section based on access
    const filteredSectionItems = section.items?.filter((item: any) => {
      if (item.access && !item.access.includes(displayRole as any)) {
        return false;
      }
      return true;
    });

    return {
      ...section,
      items: filteredSectionItems,
    };
  }).filter(Boolean); // Remove null sections

  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader className="bg-[var(--first-color)] border-b border-[var(--sidebar-border)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-[var(--third-color)] hover:bg-[var(--forth-color)] "
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={session?.user.image || "/default-image.png"}
                  alt={session?.user.name || "profile"}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {session?.user.name || "User"}
                </span>
                <span className="truncate text-xs">IEDC, UEMK</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[var(--first-color)]">
        <NavMain items={filteredItems as any} />
      </SidebarContent>
      <SidebarFooter className="bg-[var(--first-color)] border-t border-[var(--sidebar-border)]">
        <NavUser
          user={{
            name: session?.user?.name || "User",
            email: session?.user?.email || "user@example.com",
            avatar: session?.user?.image || "/avatars/default.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
