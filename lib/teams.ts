import "server-only"

import crypto from "node:crypto"
import { ObjectId } from "mongodb"
import {
  getDb,
  getUserByEmail,
  type Team,
  type TeamBrandKit,
  type TeamInvite,
  type TeamMember,
  type TeamRole,
  type User,
} from "./db"
import { isAtLeastTier } from "./feature-flags"
import { PLAN_BY_TIER } from "./plans"

const INVITE_TTL_DAYS = 7

export async function createTeam(
  ownerEmail: string,
  name: string,
): Promise<Team | null> {
  const owner = await getUserByEmail(ownerEmail)
  if (!owner) return null
  if (!isAtLeastTier(owner, "studio")) {
    throw new Error("studio_or_enterprise_required")
  }

  const db = await getDb()
  const now = new Date()
  const seatsAllowed =
    owner.planTier === "enterprise"
      ? -1
      : PLAN_BY_TIER[owner.planTier ?? "studio"].teamSeats

  const insert: Omit<Team, "_id"> = {
    ownerEmail,
    name,
    seatsAllowed,
    createdAt: now,
    updatedAt: now,
  }
  const result = await db.collection<Team>("teams").insertOne(insert as Team)
  const teamId = result.insertedId
  await db.collection<TeamMember>("team_members").insertOne({
    teamId,
    email: ownerEmail,
    role: "owner",
    invitedBy: ownerEmail,
    joinedAt: now,
  })
  await db
    .collection<User>("users")
    .updateOne({ email: ownerEmail }, { $set: { teamId, teamRole: "owner" } })

  return { ...insert, _id: teamId }
}

export async function getTeamById(teamId: string | ObjectId): Promise<Team | null> {
  const db = await getDb()
  const _id = typeof teamId === "string" ? new ObjectId(teamId) : teamId
  return db.collection<Team>("teams").findOne({ _id })
}

export async function getTeamForUser(email: string): Promise<{
  team: Team | null
  members: TeamMember[]
}> {
  const user = await getUserByEmail(email)
  if (!user?.teamId) return { team: null, members: [] }
  const db = await getDb()
  const team = await db.collection<Team>("teams").findOne({ _id: user.teamId })
  if (!team) return { team: null, members: [] }
  const members = await db
    .collection<TeamMember>("team_members")
    .find({ teamId: team._id })
    .toArray()
  return { team, members }
}

export async function updateBrandKit(
  teamId: ObjectId,
  brandKit: TeamBrandKit,
): Promise<Team | null> {
  const db = await getDb()
  const result = await db.collection<Team>("teams").findOneAndUpdate(
    { _id: teamId },
    { $set: { brandKit, updatedAt: new Date() } },
    { returnDocument: "after" },
  )
  return result
}

export async function inviteMember(args: {
  teamId: ObjectId
  email: string
  invitedBy: string
  role: TeamRole
}): Promise<TeamInvite> {
  const db = await getDb()
  const team = await db.collection<Team>("teams").findOne({ _id: args.teamId })
  if (!team) throw new Error("team_not_found")

  if (team.seatsAllowed !== -1) {
    const memberCount = await db
      .collection<TeamMember>("team_members")
      .countDocuments({ teamId: args.teamId })
    if (memberCount >= team.seatsAllowed) {
      throw new Error("seats_exhausted")
    }
  }

  const token = crypto.randomBytes(24).toString("hex")
  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)
  const invite: Omit<TeamInvite, "_id"> = {
    teamId: args.teamId,
    email: args.email.toLowerCase().trim(),
    token,
    role: args.role,
    invitedBy: args.invitedBy,
    expiresAt,
    status: "pending",
    createdAt: now,
  }
  const result = await db
    .collection<TeamInvite>("team_invites")
    .insertOne(invite as TeamInvite)
  return { ...invite, _id: result.insertedId }
}

export async function acceptInvite(token: string, email: string): Promise<{
  ok: boolean
  reason?: string
  team?: Team
}> {
  const db = await getDb()
  const invite = await db.collection<TeamInvite>("team_invites").findOne({ token })
  if (!invite) return { ok: false, reason: "invalid_token" }
  if (invite.status !== "pending") return { ok: false, reason: "already_processed" }
  if (invite.expiresAt < new Date()) {
    await db
      .collection<TeamInvite>("team_invites")
      .updateOne({ _id: invite._id }, { $set: { status: "expired" } })
    return { ok: false, reason: "expired" }
  }
  if (invite.email !== email.toLowerCase().trim()) {
    return { ok: false, reason: "email_mismatch" }
  }
  const user = await getUserByEmail(email)
  if (!user) return { ok: false, reason: "no_user" }

  await db.collection<TeamMember>("team_members").insertOne({
    teamId: invite.teamId,
    email,
    role: invite.role,
    invitedBy: invite.invitedBy,
    joinedAt: new Date(),
  })
  await db
    .collection<User>("users")
    .updateOne({ email }, { $set: { teamId: invite.teamId, teamRole: invite.role } })
  await db
    .collection<TeamInvite>("team_invites")
    .updateOne({ _id: invite._id }, { $set: { status: "accepted" } })
  const team = await db.collection<Team>("teams").findOne({ _id: invite.teamId })
  return { ok: true, team: team ?? undefined }
}

export async function changeMemberRole(
  teamId: ObjectId,
  email: string,
  role: TeamRole,
): Promise<TeamMember | null> {
  const db = await getDb()
  const result = await db
    .collection<TeamMember>("team_members")
    .findOneAndUpdate(
      { teamId, email },
      { $set: { role } },
      { returnDocument: "after" },
    )
  if (result) {
    await db.collection<User>("users").updateOne({ email }, { $set: { teamRole: role } })
  }
  return result
}

export async function removeMember(teamId: ObjectId, email: string): Promise<void> {
  const db = await getDb()
  await db
    .collection<TeamMember>("team_members")
    .deleteOne({ teamId, email })
  await db
    .collection<User>("users")
    .updateOne({ email }, { $set: { teamId: null, teamRole: null } })
}
