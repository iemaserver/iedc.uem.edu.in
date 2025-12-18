import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardPage() {
  return (
    <>
      
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="py-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome to IEDC Portal Dashboard</p>
        </div>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Statistics</span>
          </div>
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Recent Activities</span>
          </div>
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Quick Actions</span>
          </div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min flex items-center justify-center">
          <span className="text-muted-foreground">Main Content Area</span>
        </div>
      </div>
    </>
  )
}
