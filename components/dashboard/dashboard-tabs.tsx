'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CreateAdForm } from "./create-ad-form"
import { CreateCarProjectForm } from "./create-car-form"
import { AdList } from "./ad-list"
import { ReferEarn } from "./refer-earn"
import { CreditsTab } from "./credits-tab"
import { CreativeBriefWizard } from "./creative-brief-wizard"
import { DesignRequestList } from "./design-request-list"
import { UpgradeModal } from "@/components/billing/upgrade-modal"
import { ExternalLink, Plus, FolderOpen, Zap, Megaphone, Palette, Gift, Clock, Car } from "lucide-react"
import type { CarProject } from '@/lib/db'
import { cn } from '@/lib/utils'

interface DashboardTabsProps {
  isAtLimit: boolean
  isExpired: boolean | null
  userEmail: string
  userName: string
  country?: "IN" | "US"
}

const TABS = [
  { id: "projects",       label: "Projects",       icon: FolderOpen },
  { id: "create-project", label: "New Project",     icon: Plus },
  { id: "credits",        label: "AI Credits",      icon: Zap },
  { id: "create-ad",      label: "Advertise",       icon: Megaphone },
  { id: "design-service", label: "Design Service",  icon: Palette },
  { id: "refer",          label: "Refer & Earn",    icon: Gift },
] as const

type TabId = typeof TABS[number]["id"]

export function DashboardTabs({ isAtLimit, isExpired, userEmail, userName, country = "IN" }: DashboardTabsProps) {
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabId>('projects')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [carProjects, setCarProjects] = useState<CarProject[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [renewAdType, setRenewAdType] = useState<string | undefined>(undefined)

  useEffect(() => {
    const p = searchParams.get('tab') as TabId | null
    const valid = TABS.map(t => t.id) as TabId[]
    setActiveTab(valid.includes(p as TabId) ? (p as TabId) : 'projects')
  }, [searchParams])

  useEffect(() => {
    if (isAtLimit && activeTab === 'create-project') setUpgradeOpen(true)
  }, [isAtLimit, activeTab])

  useEffect(() => {
    if (activeTab === 'create-ad') fetchAdvertisements()
    else if (activeTab === 'projects') fetchCarProjects()
  }, [activeTab])

  async function fetchAdvertisements() {
    try {
      const r = await fetch('/api/ads')
      if (r.ok) setAdvertisements(await r.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }

  async function fetchCarProjects() {
    setProjectsLoading(true)
    try {
      const r = await fetch('/api/projects')
      if (r.ok) { const d = await r.json(); setCarProjects(d.projects || []) }
    } catch { /* silent */ } finally { setProjectsLoading(false) }
  }

  const handleAdCreated = () => { setRenewAdType(undefined); fetchAdvertisements() }
  const handleRenew = (adType: string) => { setRenewAdType(adType); setActiveTab('create-ad'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleOpenProject = (id: string) => {
    const url = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    window.location.href = `${url}?projectId=${id}&email=${userEmail}`
  }

  return (
    <div className="space-y-6">

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-hide gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === id
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        trigger="project_limit"
        recommendedTier="pro"
        country={country}
      />

      {/* ── Projects ───────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Your Car Projects</h2>
              <p className="text-sm text-muted-foreground">Click any project to open the editor</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setActiveTab('create-project')} disabled={isAtLimit || !!isExpired}>
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card animate-pulse">
                  <div className="aspect-video bg-secondary/60 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-secondary/60 rounded w-3/4" />
                    <div className="h-3 bg-secondary/40 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : carProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Create your first project and start visualising car wraps, colours, and accessories.
              </p>
              <Button onClick={() => setActiveTab('create-project')} className="mt-5 gap-2" disabled={isAtLimit || !!isExpired}>
                <Plus className="h-4 w-4" /> Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {carProjects.map((project) => {
                const id = project._id?.toString() || ''
                const img = project.baseImage && (project.baseImage.startsWith('data:') || project.baseImage.startsWith('http')) ? project.baseImage : ''
                return (
                  <div
                    key={id}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all hover:border-primary/40 hover:shadow-lg cursor-pointer"
                    onClick={() => handleOpenProject(id)}
                  >
                    <div className="aspect-video bg-secondary/40 overflow-hidden relative">
                      {img ? (
                        <img src={img} alt={project.projectName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/30">
                          <Car className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-white">
                          <ExternalLink className="h-3 w-3" /> Open in Editor
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{project.projectName}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {project.carDetails.year} {project.carDetails.make} {project.carDetails.model}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        {new Date(project.lastAccessedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New Project ────────────────────────────────────────────────── */}
      {activeTab === 'create-project' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Create New Project</h2>
            <p className="text-sm text-muted-foreground">Start a new car customisation canvas</p>
          </div>
          <CreateCarProjectForm userEmail={userEmail} userName={userName} onProjectCreated={() => {}} />
        </div>
      )}

      {/* ── AI Credits ─────────────────────────────────────────────────── */}
      {activeTab === 'credits' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">AI Credits</h2>
            <p className="text-sm text-muted-foreground">Manage and top up your AI feature credits</p>
          </div>
          <CreditsTab country={country} />
        </div>
      )}

      {/* ── Advertise ──────────────────────────────────────────────────── */}
      {activeTab === 'create-ad' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Advertising</h2>
            <p className="text-sm text-muted-foreground">Create and manage your ad placements</p>
          </div>
          <CreateAdForm
            userEmail={userEmail}
            userName={userName}
            country={country}
            initialAdType={renewAdType}
            onAdCreated={handleAdCreated}
          />
          <div>
            <h3 className="text-base font-semibold mb-4">Your Advertisements</h3>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/50 bg-card h-28 animate-pulse" />
                ))}
              </div>
            ) : (
              <AdList advertisements={advertisements} onRenew={handleRenew} />
            )}
          </div>
        </div>
      )}

      {/* ── Design Service ─────────────────────────────────────────────── */}
      {activeTab === 'design-service' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Ad Creative Design Service</h2>
                <p className="text-sm text-muted-foreground">
                  Professional banners designed by our team in 2–3 business days
                </p>
              </div>
            </div>
          </div>
          <CreativeBriefWizard userEmail={userEmail} userName={userName} country={country} />
          <div className="border-t border-border/40 pt-8">
            <h4 className="text-base font-semibold mb-4">Your Design Requests</h4>
            <DesignRequestList />
          </div>
        </div>
      )}

      {/* ── Refer & Earn ───────────────────────────────────────────────── */}
      {activeTab === 'refer' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Refer & Earn</h2>
            <p className="text-sm text-muted-foreground">Share your link and earn credits for every signup</p>
          </div>
          <ReferEarn country={country} />
        </div>
      )}

    </div>
  )
}
