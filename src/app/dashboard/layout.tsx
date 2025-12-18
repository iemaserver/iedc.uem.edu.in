"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  console.log("Current router path:", pathname);
  
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[var(--first-color)]">
        <Loader className="animate-spin text-[var(--third-color)]" size={48} />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[var(--second-color)] shadow-[inset_0_0_50px_rgba(0,0,0,0.2)] flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-black bg-[var(--first-color)]">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {session.user.name && (
                  <BreadcrumbItem className="hidden md:block text-green-400 font-medium">
                    {session.user.name}
                  </BreadcrumbItem>
                )}

                <BreadcrumbSeparator className="hidden md:block" />
                {/* Dynamically generate breadcrumb items based on the current path */}
                {(() => {
                  const segments = pathname
                    .split("/")
                    .filter((segment) => segment && segment.toLowerCase() !== "student" && segment.toLowerCase() !== "teacher");
                  
                  return segments.map((segment, index) => {
                    // Build the full path up to this segment including the original student/teacher segments
                    const fullPathSegments = pathname.split("/").filter(s => s);
                    const currentIndex = fullPathSegments.findIndex((s, i) => 
                      i >= segments.slice(0, index).filter(seg => fullPathSegments.includes(seg)).length && 
                      s === segment
                    );
                    const path = "/" + fullPathSegments.slice(0, currentIndex + 1).join("/");
                    const isLast = index === segments.length - 1;
                    
                    return (
                      <React.Fragment key={`breadcrumb-${path}`}>
                        {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="text-[var(--forth-color)] font-medium capitalize">
                              {segment.replace(/-/g, " ")}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={path}
                              className="text-[var(--forth-color)]/80 hover:text-[var(--third-color)] font-medium capitalize"
                            >
                              {segment.replace(/-/g, " ")}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  });
                })()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}
