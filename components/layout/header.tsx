"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Car, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react"
import { CreditsBadge } from "@/components/layout/credits-badge"
import {
  trackSignInClick,
  trackSignUpClick,
  trackSignOutClick,
  trackNavLinkClick,
  trackUserMenuClick,
  trackLogoClick,
} from "@/lib/gtag"

const NAV_LINKS = [
  { label: "Features",     href: "/#features",     title: "Explore AutoVision Pro's car customization features" },
  { label: "Pricing",      href: "/pricing",        title: "View AutoVision Pro pricing plans" },
  { label: "Testimonials", href: "/#testimonials",  title: "Read AutoVision Pro customer testimonials" },
  { label: "Advertise",    href: "/#advertise",     title: "Advertise your shop or dealership on AutoVision Pro" },
]

export function Header() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" title="AutoVision Pro home" onClick={() => trackLogoClick("header")} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">AutoVision Pro</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              title={l.title}
              onClick={() => trackNavLinkClick(l.label, "header_nav")}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-gray-100" />
          ) : session?.user ? (
            <>
              <CreditsBadge />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{session.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" title="Go to your dashboard" onClick={() => trackUserMenuClick("dashboard")} className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" title="View your profile" onClick={() => trackUserMenuClick("profile")} className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      trackSignOutClick()
                      signOut({ callbackUrl: "/" })
                    }}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" title="Sign in to AutoVision Pro" onClick={() => trackSignInClick("header")} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-gray-700">Sign In</Button>
              </Link>
              <Link href="/signup" title="Create a free AutoVision Pro account" onClick={() => trackSignUpClick("header")}>
                <Button size="sm" className="shadow-sm">Get Started</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                title={l.title}
                onClick={() => {
                  trackNavLinkClick(l.label, "header_nav_mobile")
                  setOpen(false)
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {l.label}
              </Link>
            ))}
            {!session?.user && (
              <Link
                href="/login"
                title="Sign in to AutoVision Pro"
                onClick={() => {
                  trackSignInClick("header_mobile")
                  setOpen(false)
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
