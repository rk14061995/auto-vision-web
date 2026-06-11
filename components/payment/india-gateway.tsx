"use client"

import { cn } from "@/lib/utils"

export type IndiaGateway = "razorpay" | "payu"

interface Props {
  selected: IndiaGateway
  onChange: (g: IndiaGateway) => void
}

const GATEWAYS: { id: IndiaGateway; label: string; methods: string; color: string; textColor: string }[] = [
  {
    id: "razorpay",
    label: "Razorpay",
    methods: "Cards · UPI · Net Banking · Wallets",
    color: "bg-[#072654]",
    textColor: "text-white",
  },
  {
    id: "payu",
    label: "PayU",
    methods: "Cards · UPI · Net Banking · EMI",
    color: "bg-[#4a90d9]",
    textColor: "text-white",
  },
]

export function IndiaGatewaySelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment gateway</p>
      <div className="grid grid-cols-2 gap-3">
        {GATEWAYS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-4 text-center transition-all",
              selected === g.id
                ? "border-primary ring-1 ring-primary/50"
                : "border-border/50 hover:border-border"
            )}
          >
            {/* Coloured badge */}
            <span className={cn("rounded-md px-2.5 py-1 text-sm font-bold tracking-tight", g.color, g.textColor)}>
              {g.label}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">{g.methods}</span>
            {selected === g.id && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <svg className="h-2.5 w-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Dynamically submit a form to PayU from field data returned by /api/payu/create-order */
export function submitPayUForm(fields: Record<string, string>, formUrl: string) {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = formUrl
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}
