"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Crown, Trash2, Users } from "lucide-react"
import type { Team, TeamMember, TeamRole } from "@/lib/db"

interface TeamResponse {
  team: Team | null
  members: TeamMember[]
}

export function TeamWorkspace() {
  const [data, setData] = useState<TeamResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>("member")
  const [inviting, setInviting] = useState(false)
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null)
  const [brandPrimary, setBrandPrimary] = useState("#0ea5e9")
  const [brandLogo, setBrandLogo] = useState("")
  const [savingBrand, setSavingBrand] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/teams")
      const json = (await res.json()) as TeamResponse
      setData(json)
      if (json.team?.brandKit) {
        setBrandPrimary(json.team.brandKit.primaryColor || "#0ea5e9")
        setBrandLogo(json.team.brandKit.logoUrl || "")
      }
    } catch {
      toast.error("Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create team")
      toast.success("Team created")
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to invite")
      setLatestInviteUrl(json.acceptUrl)
      setInviteEmail("")
      toast.success("Invite created — copy the link below")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  async function changeRole(email: string, role: TeamRole) {
    const res = await fetch(`/api/teams/members/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to update role")
      return
    }
    toast.success("Role updated")
    await load()
  }

  async function remove(email: string) {
    if (!confirm(`Remove ${email}?`)) return
    const res = await fetch(`/api/teams/members/${encodeURIComponent(email)}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to remove")
      return
    }
    toast.success("Member removed")
    await load()
  }

  async function saveBrandKit(e: React.FormEvent) {
    e.preventDefault()
    setSavingBrand(true)
    try {
      const res = await fetch("/api/teams/brand-kit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor: brandPrimary, logoUrl: brandLogo }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Brand kit saved")
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingBrand(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  if (!data?.team) {
    return (
      <form onSubmit={createTeam} className="rounded-2xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-semibold">Create your team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your studio a name. You can rename it later.
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="e.g. Velocity Wraps"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <Button type="submit" disabled={creating || !teamName.trim()}>
            {creating ? "Creating..." : "Create team"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{data.team.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.members.length} member{data.members.length === 1 ? "" : "s"} •{" "}
              {data.team.seatsAllowed === -1
                ? "unlimited seats"
                : `${data.team.seatsAllowed} seats`}
            </p>
          </div>
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="mt-6 divide-y divide-border/50 rounded-xl border border-border/50">
          {data.members.map((member) => (
            <div key={member.email} className="flex items-center justify-between p-3 text-sm">
              <div className="flex items-center gap-2">
                {member.role === "owner" && <Crown className="h-4 w-4 text-amber-500" />}
                <span className="font-medium">{member.email}</span>
                <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
              </div>
              <div className="flex gap-2">
                {member.role !== "owner" && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.email, e.target.value as TeamRole)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => remove(member.email)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={invite} className="rounded-2xl border border-border/50 bg-card p-6">
        <h3 className="text-base font-semibold">Invite a teammate</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <Input
            type="email"
            placeholder="teammate@studio.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as TeamRole)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
            {inviting ? "Sending..." : "Send invite"}
          </Button>
        </div>
        {latestInviteUrl && (
          <div className="mt-3 rounded-lg bg-secondary/40 p-3 text-xs">
            <p className="font-medium">Share this link with the teammate:</p>
            <code className="mt-1 block break-all text-muted-foreground">{latestInviteUrl}</code>
          </div>
        )}
      </form>

      <form onSubmit={saveBrandKit} className="rounded-2xl border border-border/50 bg-card p-6">
        <h3 className="text-base font-semibold">Brand kit</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="primary">Primary color</Label>
            <Input
              id="primary"
              type="color"
              value={brandPrimary}
              onChange={(e) => setBrandPrimary(e.target.value)}
              className="h-10 w-20"
            />
          </div>
          <div>
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              placeholder="https://..."
              value={brandLogo}
              onChange={(e) => setBrandLogo(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={savingBrand}>
          {savingBrand ? "Saving..." : "Save brand kit"}
        </Button>
      </form>
    </div>
  )
}
