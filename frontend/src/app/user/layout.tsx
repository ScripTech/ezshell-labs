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

// Define breadcrumb labels for paths
const pathLabels: Record<string, string> = {
  user: "Dashboard",
  labs: "Labs",
  settings: "Settings",
  profile: "Profile",
}

export default function UserLayout({
  children,
  ...props
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean)

    return paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`
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
      <AppSidebar session={session} props={props}/>
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
