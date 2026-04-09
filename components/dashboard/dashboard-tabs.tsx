'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CreateAdForm } from "./create-ad-form"
import { AdList } from "./ad-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Folder,
  Clock,
} from "lucide-react"

interface Advertisement {
  _id: string
  email: string
  shopName: string
  shopDescription: string
  contactInfo: string
  images: string[]
  adType: string
  status: "active" | "expired" | "pending"
  views: number
  clicks: number
  startDate: Date
  endDate: Date
  paymentAmount: number
  paymentCurrency: string
  paymentId: string | null
  createdAt: Date
  updatedAt: Date
}

interface DashboardTabsProps {
  projects: any[]
  isAtLimit: boolean
  isExpired: boolean | null
  userEmail: string
  userName: string
}

export function DashboardTabs({ projects, isAtLimit, isExpired, userEmail, userName }: DashboardTabsProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam === 'create-ad' ? 'create-ad' : 'projects')
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tabParam === 'create-ad') {
      setActiveTab('create-ad')
    }
  }, [tabParam])

  useEffect(() => {
    if (activeTab === 'create-ad') {
      fetchAdvertisements()
    }
  }, [activeTab, userEmail])

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/ads')
      if (response.ok) {
        const data = await response.json()
        setAdvertisements(data)
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdCreated = () => {
    // Refresh advertisements
    fetchAdvertisements()
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <TabsList>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="create-ad">Create Ad</TabsTrigger>
      </TabsList>

      <TabsContent value="projects" className="mt-6">
        {/* Projects List */}
        <div>
          <h2 className="text-lg font-semibold">Your Projects</h2>
          {projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start designing
              </p>
              <Button className="mt-4 gap-2" disabled={isAtLimit || !!isExpired}>
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group cursor-pointer rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:shadow-lg"
                >
                  <div className="aspect-video rounded-lg bg-secondary" />
                  <h3 className="mt-4 font-medium group-hover:text-primary">
                    {project.name}
                  </h3>
                  <p className="mt-1 flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {project.lastModified}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="create-ad" className="mt-6">
        <div className="space-y-6">
          <CreateAdForm
            userEmail={userEmail}
            userName={userName}
            onAdCreated={handleAdCreated}
          />

          <div>
            <h3 className="text-lg font-semibold mb-4">Your Advertisements</h3>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading advertisements...</p>
              </div>
            ) : (
              <AdList advertisements={advertisements} />
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}