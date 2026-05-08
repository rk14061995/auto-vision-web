'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CreateAdForm } from "./create-ad-form"
import { CreateCarProjectForm } from "./create-car-form"
import { AdList } from "./ad-list"
import { ReferEarn } from "./refer-earn"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink } from "lucide-react"
import {
  Plus,
  Folder,
  Clock,
} from "lucide-react"
import type { CarProject } from '@/lib/db'

interface DashboardTabsProps {
  isAtLimit: boolean
  isExpired: boolean | null
  userEmail: string
  userName: string
}

export function DashboardTabs({ isAtLimit, isExpired, userEmail, userName }: DashboardTabsProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    tabParam === 'refer'
      ? 'refer'
      : tabParam === 'create-ad'
        ? 'create-ad'
        : tabParam === 'create-project'
          ? 'create-project'
          : 'projects'
  )
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [carProjects, setCarProjects] = useState<CarProject[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)

  useEffect(() => {
    if (tabParam === 'create-ad') {
      setActiveTab('create-ad')
    } else if (tabParam === 'create-project') {
      setActiveTab('create-project')
    } else if (tabParam === 'refer') {
      setActiveTab('refer')
    }
  }, [tabParam])

  useEffect(() => {
    if (activeTab === 'create-ad') {
      fetchAdvertisements()
    } else if (activeTab === 'projects') {
      fetchCarProjects()
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

  const fetchCarProjects = async () => {
    try {
      setProjectsLoading(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setCarProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleAdCreated = () => {
    fetchAdvertisements()
  }

  const handleProjectCreated = (projectId: string) => {
    // This will redirect to dashboard app, so we don't need to refresh here
  }

  const handleOpenProject = (projectId: string) => {
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    window.location.href = `${dashboardUrl}?projectId=${projectId}&email=${userEmail}`
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <TabsList>
        <TabsTrigger value="projects">Car Projects</TabsTrigger>
        <TabsTrigger value="create-project">New Project</TabsTrigger>
        <TabsTrigger value="create-ad">Create Ad</TabsTrigger>
        <TabsTrigger value="refer">Refer & Earn</TabsTrigger>
      </TabsList>

      <TabsContent value="projects" className="mt-6">
        {/* Car Projects List */}
        <div>
          <h2 className="text-lg font-semibold">Your Car Projects</h2>
          {projectsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : carProjects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start customizing cars
              </p>
              <Button 
                onClick={() => setActiveTab('create-project')}
                className="mt-4 gap-2" 
                disabled={isAtLimit || !!isExpired}
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {carProjects.map((project) => {
                const projectId = project._id?.toString() || ''
                const imageSrc =
                  project.baseImage &&
                  (project.baseImage.startsWith('data:') ||
                    project.baseImage.startsWith('http://') ||
                    project.baseImage.startsWith('https://'))
                    ? project.baseImage
                    : ''
                return (
                  <div
                    key={projectId}
                    className="group rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:shadow-lg"
                  >
                    {project.baseImage && (
                      <div className="aspect-video rounded-lg bg-secondary overflow-hidden">
                        <img 
                          src={imageSrc} 
                          alt={project.projectName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="mt-4">
                      <h3 className="font-medium group-hover:text-primary">
                        {project.projectName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.carDetails.year} {project.carDetails.make} {project.carDetails.model}
                      </p>
                      <p className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(project.lastAccessedAt).toLocaleDateString()}
                      </p>
                      <Button 
                        onClick={() => handleOpenProject(projectId)}
                        size="sm" 
                        className="mt-4 w-full gap-1"
                        variant="outline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open & Edit
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="create-project" className="mt-6">
        <CreateCarProjectForm
          userEmail={userEmail}
          userName={userName}
          onProjectCreated={handleProjectCreated}
        />
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

      <TabsContent value="refer" className="mt-6">
        <ReferEarn userEmail={userEmail} />
      </TabsContent>
    </Tabs>
  )
}