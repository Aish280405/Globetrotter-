"use client"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Sparkles, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { Suspense, useState, useEffect } from "react"

function NavContent() {
  const { openSignIn } = useClerk()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/logs")
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.length)
        }
      } catch (err) {
        // silently fail for nav badge
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <SignedOut>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="hover:text-primary transition-colors" href="#features">Features</Link>
          <Link className="hover:text-primary transition-colors" href="#how-it-works">How It Works</Link>
        </nav>
      </SignedOut>
      <SignedIn>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="hover:text-primary transition-colors" href="/concierge">Trip Concierge</Link>
          <Link className="hover:text-primary transition-colors" href="/llm">AI Travel Planner</Link>
          <Link className="hover:text-primary transition-colors" href="/mapcalendar">My Schedule</Link>
          <Link className="hover:text-primary transition-colors" href="/community">Community</Link>
        </nav>
      </SignedIn>
      <div className="flex items-center justify-end gap-3">
        <SignedOut>
          <Button
            className="h-10 rounded-full px-5"
            onClick={() => openSignIn({ redirectUrl: `${window.location.origin}/auth-redirect` })}
          >
            Login
          </Button>
        </SignedOut>
        <SignedIn>
          <Link className="relative hover:text-primary transition-colors" href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </>
  )
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex size-7 items-center justify-center rounded-md border"><Sparkles className="size-4" /></span>
          <span>GlobeTrotter</span>
        </Link>
        <Suspense fallback={<div className="w-32 h-10" />}>
          <NavContent />
        </Suspense>
      </div>
    </header>
  )
}
