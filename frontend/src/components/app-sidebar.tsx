"use client"

import * as React from "react"
import {
  Command,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Session } from "next-auth"

// This is sample data.
const data = {
  user: {
    name: "Annonymos",
    email: "guest@example.com",
    avatar: "/avatars/guest.jpg",
  },
  teams: [
    {
      name: "Lab Playground",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Labs",
          url: "/user/labs",
        },
        {
          title: "History",
          url: "/user/labs/history",
        },
        {
          title: "Enrolled Labs",
          url: "/user/labs?q=enrolled",
        }
      ],
    },
    {
      title: "Settings",
      url: "#",
      isActive: true,
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ children, session, ...props }: Readonly<{
  children: React.ReactNode;
  props: React.ComponentProps<typeof Sidebar>,
  session: Session | null }>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {children}
        {/* <NavMain items={data.navMain} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: session?.user?.name ?? "Anonymous",
          email: session?.user?.email ?? "",
          avatar: session?.user?.image ?? "",
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
