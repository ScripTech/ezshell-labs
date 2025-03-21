'use client'

import Link from "next/link"
import { CircleUser, Menu, Search, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function layout({ children }: any) {

  const router = useRouter()
  const { data: session } = useSession()
  const userName = session?.user?.name ?? 'Anonymous'

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Terminal className="h-6 w-6" />
            <span className="sr-only">eAlgoritimo Inc</span>
          </Link>
          <Link
            href="/"
            className="text-foreground transition-colors hover:text-foreground text-nowrap"
          >
            eZShell Labs
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
              <Link href="#" className="hover:text-foreground">
                Settings
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <div>{userName}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={userName}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <CircleUser className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2 w-64">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/account/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()} className="stext-red-500 hover:font-semibold bg-red-500 bg-opacity-30s cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 md:gap-8">
        {children}
      </main>
    </div>
  )
}
