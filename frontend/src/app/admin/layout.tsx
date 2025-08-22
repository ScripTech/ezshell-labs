'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { NavMain } from "@/components/nav-main"

// Define breadcrumb labels for paths
const pathLabels: Record<string, string> = {
  labs: "Labs",
  billing: "Billing",
}

// Define admin and user menu items
const adminNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    isActive: true,
    items: [
      { title: "Overview", url: "/admin" },
      { title: "Enrollments", url: "/admin#enrollments" },
      { title: "Analytics", url: "/admin#analytics" },
    ],
  },
  {
    title: "Labs",
    url: "/admin/labs",
    isActive: true,
    items: [
      { title: "All Labs", url: "/admin/labs" },
      { title: "Create Lab", url: "/admin/labs/create" },
      { title: "Lab Assignments", url: "/admin/lab-assignments" },
    ],
  },
  {
    title: "Users",
    url: "/admin/users",
    isActive: true,
    items: [
      { title: "All Users", url: "/admin/users" },
      { title: "Invite User", url: "/admin/users/invite" },
      { title: "Enrollments", url: "/admin/users/enrollments" },
    ],
  },
  {
    title: "Instructors",
    url: "/admin/instructors",
    isActive: true,
    items: [
      { title: "All Instructors", url: "/admin/instructors" },
      { title: "Add Instructor", url: "/admin/instructors/create" },
    ],
  },
  {
    title: "Authentication",
    url: "/admin/auth",
    isActive: true,
    items: [
      { title: "User Management", url: "/admin/auth/users" },
      { title: "Role Management", url: "/admin/auth/roles" },
    ],
  },
  {
    title: "Content",
    url: "/admin/content",
    isActive: true,
    items: [
      { title: "Articles", url: "/admin/content/articles" },
      { title: "Add Article", url: "/admin/content/articles/create" },
      { title: "Resources", url: "/admin/content/resources" },
    ],
  },
  {
    title: "Reports",
    url: "/admin/reports",
    isActive: true,
    items: [
      { title: "Usage", url: "/admin/reports/usage" },
      { title: "Errors", url: "/admin/reports/errors" },
    ],
  },
  {
    title: "Billing",
    url: "/admin/billing",
    isActive: true,
    items: [],
  },
  {
    title: "AWS Instances",
    url: "/admin/aws-instances",
    isActive: true,
    items: [
      { title: "All Instances", url: "/admin/aws-instances" },
      { title: "Instance Monitor", url: "/admin/aws-instances/monitor" },
    ],
  },
  {
    title: "Settings",
    url: "/admin/settings",
    isActive: true,
    items: [],
  },
]

const userNavItems = [
  {
    title: "Playground",
    url: "/playground",
    isActive: true,
    items: [
      { title: "Labs", url: "/playground/labs" },
      { title: "History", url: "/playground/history" },
      { title: "Enrolled Labs", url: "/playground/enrolled" },
    ],
  },
]

export default function UserLayout({
  children,
  ...props
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession()
  const pathname = usePathname()


  // Set active state for nav items based on pathname
  const navMain = (adminNavItems).map(item => ({
    ...item,
    isActive: pathname.startsWith(item.url),
    items: item.items?.map(subItem => ({
      ...subItem,
      // Optionally, set active state for subitems if needed
    })),
  }))

  const data = { navMain }

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean)

    return paths.map((path, index) => {
      const href = `/${ paths.slice(0, index + 1).join('/') }`
      const label = pathLabels[path] || path.charAt(0).toUpperCase() + path.slice(1)
      const isLast = index === paths.length - 1

      return {
        href,
        label,
        isLast,
      }
    })
  }, [pathname])

  return (
    <SidebarProvider>
      <AppSidebar session={session} props={props}>
        <NavMain items={data.navMain} groupLabel="Administration"/>
      </AppSidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map(({ href, label, isLast }, index) => (
                  <li key={href} className="flex items-center">
                    {!isLast ? (
                      <>
                        <a
                          href={href}
                          className="text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                          {label}
                        </a>
                        <ChevronRightIcon className="w-5 h-5" />
                      </>
                    ) : (
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
