"use client"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { Suspense } from "react"

function NavContent() {
  const { openSignIn } = useClerk()
  return (
    <>
      <SignedOut>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="hover:underline" href="#benefits">Benefits</Link>
          <Link className="hover:underline" href="#specs">Specifications</Link>
          <Link className="hover:underline" href="#howto">How-to</Link>
          <Link className="hover:underline" href="#contact">Contact Us</Link>
        </nav>
      </SignedOut>
      <SignedIn>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="hover:text-primary transition-colors" href="/concierge">Trip Concierge</Link>
          <Link className="hover:text-primary transition-colors" href="/llm">AI Travel Planner</Link>
          <Link className="hover:text-primary transition-colors" href="/mapcalendar">My Schedule</Link>
          <Link className="hover:text-primary transition-colors" href="/community">View Community</Link>
          <Link className="hover:text-primary transition-colors" href="/notifications">Notifications</Link>
        </nav>
      </SignedIn>
      <div className="flex items-center justify-end">
        <SignedOut>
          <Button
            className="h-10 rounded-full px-5"
            onClick={() => openSignIn({ redirectUrl: `${window.location.origin}/auth-redirect` })}
          >
            Login
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton></UserButton>
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
