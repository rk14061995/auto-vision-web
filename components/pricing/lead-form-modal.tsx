'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { trackLeadFormOpen, trackLeadFormSubmit, trackLeadFormDismiss, type LeadFormTrigger } from '@/lib/gtag'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  businessType: z.string().min(1, 'Select your business type'),
  budgetRange: z.string().min(1, 'Select a budget range'),
  interestedPlan: z.string().min(1, 'Select a plan'),
  message: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const BUSINESS_TYPES = [
  'Wrap Shop',
  'Dealership',
  'Garage / Mechanic',
  'Freelancer / Designer',
  'OEM / Brand',
  'Other',
]

const BUDGET_RANGES = [
  'Under $20/mo',
  '$20–$50/mo',
  '$50–$100/mo',
  '$100–$300/mo',
  '$300+/mo',
]

const PLANS = ['Free', 'Creator', 'Pro', 'Studio', 'Enterprise']

interface LeadFormModalProps {
  trigger: LeadFormTrigger
  onClose: () => void
}

export function LeadFormModal({ trigger, onClose }: LeadFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    trackLeadFormOpen(trigger)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [trigger])

  function handleDismiss() {
    trackLeadFormDismiss(trigger)
    onClose()
  }

  async function onSubmit(data: FormValues) {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, trigger }),
    })
    trackLeadFormSubmit(data.budgetRange, data.interestedPlan)
    localStorage.setItem('av_lead_submitted', '1')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-form-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {isSubmitSuccessful ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-semibold">We'll be in touch</h2>
            <p className="text-sm text-muted-foreground">
              Thanks! Our team will reach out within 24 hours with a pricing option that fits your budget.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-6 sm:px-8">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Limited offer</p>
              <h2 id="lead-form-title" className="mt-1 text-xl font-semibold">
                Price not right? Let's fix that.
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tell us your budget and we'll find a plan or deal that works for your business.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name</label>
                  <input
                    {...register('name')}
                    placeholder="Your name"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Phone <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 555 000 0000"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Business type</label>
                  <select
                    {...register('businessType')}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    defaultValue=""
                  >
                    <option value="" disabled>Select type</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className="mt-1 text-xs text-destructive">{errors.businessType.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Monthly budget</label>
                  <select
                    {...register('budgetRange')}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    defaultValue=""
                  >
                    <option value="" disabled>Select range</option>
                    {BUDGET_RANGES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.budgetRange && <p className="mt-1 text-xs text-destructive">{errors.budgetRange.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Which plan interests you most?</label>
                <div className="flex flex-wrap gap-2">
                  {PLANS.map((plan) => (
                    <label key={plan} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        {...register('interestedPlan')}
                        type="radio"
                        value={plan}
                        className="accent-primary"
                      />
                      <span className="text-sm">{plan}</span>
                    </label>
                  ))}
                </div>
                {errors.interestedPlan && <p className="mt-1 text-xs text-destructive">{errors.interestedPlan.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  What's holding you back? <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  {...register('message')}
                  rows={2}
                  placeholder="Tell us what you need and we'll find a solution..."
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Get a custom deal'}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                No spam. We respond within 24 hours.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
