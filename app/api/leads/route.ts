import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { saveLead, leadExistsByEmail } from '@/lib/leads'

const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  businessType: z.string().min(1),
  budgetRange: z.string().min(1),
  interestedPlan: z.string().min(1),
  message: z.string().max(500).optional(),
  trigger: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LeadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const duplicate = await leadExistsByEmail(parsed.data.email)
    if (duplicate) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    await saveLead({
      ...parsed.data,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[leads] failed to save lead', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
