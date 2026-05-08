import { getDb, type Team, type TeamMember } from "@/lib/db"

interface TeamRow {
  team: Team
  memberCount: number
}

async function getAllTeams(): Promise<TeamRow[]> {
  const db = await getDb()
  const teams = await db.collection<Team>("teams").find({}).sort({ createdAt: -1 }).toArray()
  const counts = await db
    .collection<TeamMember>("team_members")
    .aggregate([{ $group: { _id: "$teamId", count: { $sum: 1 } } }])
    .toArray()
  const countMap = new Map<string, number>()
  for (const c of counts) countMap.set(String(c._id), c.count as number)
  return teams.map((team) => ({
    team,
    memberCount: countMap.get(String(team._id)) ?? 0,
  }))
}

export default async function AdminTeamsPage() {
  const rows = await getAllTeams()
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Teams</h1>
      <p className="admin-page-subtitle">{rows.length} total</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Seats</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ team, memberCount }) => (
              <tr key={String(team._id)}>
                <td>{team.name}</td>
                <td>{team.ownerEmail}</td>
                <td>{memberCount}</td>
                <td>{team.seatsAllowed === -1 ? "∞" : team.seatsAllowed}</td>
                <td>{new Date(team.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
