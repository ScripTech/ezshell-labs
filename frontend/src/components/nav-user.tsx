"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  CircleUser,
  LogOut,
  Sparkles,
  Palette,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CaretSortIcon, ComponentPlaceholderIcon } from "@radix-ui/react-icons"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useTheme } from "@/contexts/theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"

export function NavUser({
  user,
}: {
  readonly user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering theme-dependent content
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  <CircleUser className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <CaretSortIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg"><CircleUser className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="h-4 w-4" />
                <span className="px-2">Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="h-4 w-4" />
                <Link className="px-2" href="/user/profile">Account</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ComponentPlaceholderIcon className="h-4 w-4" />
                <Link className="px-2" href="/user/billing/overview">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4" />
                <Link className="px-2" href="/user/notifications">Notifications</Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4" />
                  <span className="px-2">Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                      <Sun className="h-4 w-4" />
                      <span className="px-2">Light</span>
                      {mounted && theme === 'light' && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                      <Moon className="h-4 w-4" />
                      <span className="px-2">Dark</span>
                      {mounted && theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                      <Monitor className="h-4 w-4" />
                      <span className="px-2">System</span>
                      {mounted && theme === 'system' && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer " onClick={() => signOut()}>
              <LogOut className="h-4 w-4 text-red-400" />
              <span className="px-2 text-red-400">Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
