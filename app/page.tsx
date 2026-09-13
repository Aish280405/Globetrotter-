"use client"

import { Globe } from "@/components/magicui/globe";
import { Highlighter } from "@/components/magicui/highlighter";
import { Sparkles, MapPin, Brain, CalendarDays, MessageSquare, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useClerk, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { FC, useRef, useState, useEffect } from 'react';

function useInView<T extends HTMLElement = HTMLDivElement>(options: IntersectionObserverInit = {}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

const Home: FC = () => (
  <div className="font-sans">
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <CtaSection />
    <SiteFooter />
  </div>
)

const HeroSection: FC = () => {
  const { openSignIn } = useClerk()
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-center gap-12">

          {/* Left — Text */}
          <div className="flex-1 flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit">AI-Powered Travel Planning</Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Plan smarter trips with{" "}
              <span className="text-primary">GlobeTrotter</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Generate complete itineraries, get real-time trip updates, chat with your AI concierge, and explore destinations — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <SignedOut>
                <Button size="lg" className="rounded-full px-8"
                  onClick={() => openSignIn({ redirectUrl: `${window.location.origin}/auth-redirect` })}>
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Link href="/concierge">
                  <Button size="lg" className="rounded-full px-8">
                    Open App <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> Free to start</span>
              <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> AI-generated plans</span>
              <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> Trip notifications</span>
            </div>
          </div>

          {/* Right — Globe */}
          <div className="flex-shrink-0 w-full md:w-[560px] h-[560px] relative">
            <Globe />
          </div>

        </div>
      </div>
    </section>
  )
}

const FeaturesSection: FC = () => {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.2 });
  const features = [
    {
      icon: Brain,
      title: "AI Itinerary Generation",
      desc: "Describe your trip and get a complete day-by-day plan in seconds — activities, meals, timing, and budget all included.",
    },
    {
      icon: MessageSquare,
      title: "Trip Concierge Chat",
      desc: "Ask anything about your destination. Your AI concierge answers questions, finds restaurants, and gives local tips.",
    },
    {
      icon: CalendarDays,
      title: "Schedule & Map View",
      desc: "Visualize your entire trip on an interactive map and calendar so you always know what's next.",
    },
    {
      icon: MapPin,
      title: "Proactive Notifications",
      desc: "Get automated updates during your trip — check-in reminders, weather alerts, local events, and daily tips.",
    },
  ]
  return (
    <section id="features" className="border-b" ref={ref}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Features</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {inView ? (
              <Highlighter action="highlight" color="#8E9C78" animationDuration={1500}>
                Everything you need
              </Highlighter>
            ) : "Everything you need"}{" "}
            to travel better
          </h2>
          <p className="mt-3 text-muted-foreground">
            GlobeTrotter handles the planning so you can focus on the experience.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="inline-flex size-10 items-center justify-center rounded-lg border bg-muted/60">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const HowItWorksSection: FC = () => {
  const steps = [
    { step: "01", title: "Sign up for free", desc: "Create your account in seconds with your email." },
    { step: "02", title: "Enter your destination", desc: "Tell us where you're going and for how long." },
    { step: "03", title: "Get your AI itinerary", desc: "Receive a full day-by-day plan instantly." },
    { step: "04", title: "Travel with confidence", desc: "Get real-time updates and concierge support throughout your trip." },
  ]
  return (
    <section id="how-it-works" className="border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">How It Works</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">Up and running in minutes</h2>
          <p className="mt-3 text-muted-foreground">No complicated setup. Just great trips.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col gap-3">
              <span className="text-4xl font-bold text-primary/20">{s.step}</span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CtaSection: FC = () => {
  const { openSignIn } = useClerk()
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl mb-4">Ready to plan your next trip?</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Join thousands of travelers using GlobeTrotter to plan smarter, stress-free trips.
        </p>
        <SignedOut>
          <Button
            size="lg"
            className="rounded-full px-10"
            onClick={() => openSignIn({ redirectUrl: `${window.location.origin}/auth-redirect` })}
          >
            Start Planning for Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </SignedOut>
        <SignedIn>
          <Link href="/concierge">
            <Button size="lg" className="rounded-full px-10">
              Open App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </SignedIn>
      </div>
    </section>
  )
}

const SiteFooter: FC = () => (
  <footer className="border-t">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-md border">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold">GlobeTrotter</span>
      </div>
      <p className="text-xs text-muted-foreground">© 2026 GlobeTrotter. All rights reserved.</p>
    </div>
  </footer>
)

export default Home;
