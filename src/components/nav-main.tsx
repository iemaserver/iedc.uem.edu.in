"use client"

import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { DashboardItems, DashboardGroup } from "@/types/Datatypes";
import Link from "next/link";

export function NavMain() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") return <div className="p-4">Loading...</div>;
  if (!session) return <div className="p-4">Please log in</div>;

  const userType = session?.user?.userType;

  // Recursive function to render menu items
  const renderItems = (items: any[]) => {
    return items.map((item) => {
      const hasSubItems = item.items && item.items.length > 0;
      const isActive = pathname === item.url;

      if (hasSubItems) {
        const isAnyChildActive = item.items.some(
          (sub: any) =>
            sub.url === pathname || (sub.items && sub.items.some((child: any) => child.url === pathname))
        );

        return (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={isAnyChildActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 group
                    ${isAnyChildActive ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-indigo-50"}`}
                >
                  {item.icon && <item.icon className="text-indigo-600 w-5 h-5 flex-shrink-0" />}
                  <span className="flex-1 truncate">{item.title}</span>
                  <ChevronRight
                    className="ml-auto transition-transform duration-200 text-gray-400 group-data-[state=open]/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub className="ml-4 border-l border-gray-200 pl-2 mt-1">
                  {renderItems(item.items)}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      } else {
        return (
          <SidebarMenuSubItem key={item.title}>
            <SidebarMenuSubButton asChild>
              <Link
                href={item.url}
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200
                  ${isActive ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-indigo-50"}`}
              >
                {item.icon && <item.icon className="text-indigo-600 w-4 h-4 flex-shrink-0" />}
                <span className="flex-1 truncate">{item.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white shadow-md overflow-x-hidden">
      {/* Menu */}
      <SidebarGroup className="flex-1 overflow-y-auto">
      
        <SidebarMenu className="px-2 py-2">
          {DashboardItems.filter((group) => group.access.includes(userType)).map(
            (group: DashboardGroup) => {
              const isGroupActive = group.items.some(
                (item: any) =>
                  item.url === pathname ||
                  (item.items && item.items.some((sub: any) => sub.url === pathname))
              );

              return (
                <Collapsible
                  key={group.title}
                  asChild
                  defaultOpen={isGroupActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={group.title}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 font-medium
                          ${isGroupActive ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-indigo-50"}`}
                      >
                        {group.icon && <group.icon className="text-indigo-600 w-5 h-5 flex-shrink-0" />}
                        <span className="flex-1 truncate">{group.title}</span>
                        <ChevronRight
                          className="ml-auto transition-transform duration-200 text-gray-400 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-4 border-l border-gray-200 pl-2 mt-1">
                        {renderItems(group.items)}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }
          )}
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}
