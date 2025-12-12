"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[var(--third-color)] font-semibold tracking-wide">Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className="text-[var(--forth-color)] hover:text-[var(--third-color)] hover:bg-[var(--second-color)]/20 hover:shadow-[0_0_15px_rgba(100,204,197,0.3)] transition-all duration-300 border-l-2 border-transparent hover:border-[var(--third-color)] group"
                >
                  {item.icon && <item.icon className="group-hover:drop-shadow-[0_0_8px_rgba(100,204,197,0.6)] transition-all duration-300" />}
                  <span className="font-medium">{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover:text-[var(--third-color)]" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className="text-[var(--forth-color)]/80 hover:text-[var(--third-color)] hover:bg-[var(--second-color)]/15 hover:shadow-[0_0_10px_rgba(100,204,197,0.2)] transition-all duration-300 hover:translate-x-1 border-l-2 border-transparent hover:border-[var(--third-color)]/50"
                      >
                        <Link href={subItem.url} className="group/sub">
                          {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 group-hover/sub:drop-shadow-[0_0_5px_rgba(100,204,197,0.5)] transition-all duration-300" />}
                          <span className="font-medium">{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
