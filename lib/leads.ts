import 'server-only'
import { getDb } from './db'

export interface Lead {
  name: string
  email: string
  phone?: string
  businessType: string
  budgetRange: string
  interestedPlan: string
  message?: string
  trigger: string
  createdAt: Date
  ip?: string
  userAgent?: string
}

export async function saveLead(lead: Lead) {
  const db = await getDb()
  return db.collection('leads').insertOne({ ...lead, createdAt: new Date() })
}

export async function leadExistsByEmail(email: string): Promise<boolean> {
  const db = await getDb()
  const count = await db.collection('leads').countDocuments({ email }, { limit: 1 })
  return count > 0
}
