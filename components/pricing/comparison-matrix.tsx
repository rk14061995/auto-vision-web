"use client"

import { Check, Minus } from "lucide-react"
import type { Plan } from "@/lib/plans"

interface MatrixSection {
  label: string
  rows: { feature: string; getValue: (p: Plan) => string | boolean }[]
}

const SECTIONS: MatrixSection[] = [
  {
    label: "Workspace",
    rows: [
      {
        feature: "Active projects",
        getValue: (p) => (p.projectLimit === -1 ? "Unlimited" : `${p.projectLimit}`),
      },
      {
        feature: "Team seats",
        getValue: (p) => (p.teamSeats === -1 ? "Custom" : `${p.teamSeats}`),
      },
      {
        feature: "Brand kit",
        getValue: (p) => p.features.brandKit,
      },
    ],
  },
  {
    label: "Editor & exports",
    rows: [
      { feature: "Watermark removed", getValue: (p) => !p.features.watermark },
      {
        feature: "Export resolution",
        getValue: (p) => p.features.exportResolution.toUpperCase(),
      },
      { feature: "Premium accessories", getValue: (p) => p.features.premiumAssets },
      { feature: "Premium wraps", getValue: (p) => p.features.premiumWraps },
      { feature: "Advanced layers", getValue: (p) => p.features.advancedLayers },
      { feature: "Version history", getValue: (p) => p.features.versionHistory },
    ],
  },
  {
    label: "AI tools",
    rows: [
      {
        feature: "Monthly AI credits",
        getValue: (p) => (p.monthlyAiCredits ? `${p.monthlyAiCredits}` : "Custom"),
      },
      { feature: "Background removal", getValue: (p) => p.features.backgroundRemoval },
      { feature: "AI wrap generation", getValue: (p) => p.features.aiWrapGeneration },
      { feature: "Priority rendering", getValue: (p) => p.features.priorityRendering },
    ],
  },
  {
    label: "Collaboration & B2B",
    rows: [
      { feature: "Team workspace", getValue: (p) => p.features.teamCollab },
      { feature: "Client approval workflow", getValue: (p) => p.features.clientApprovalWorkflow },
      { feature: "White-label previews", getValue: (p) => p.features.whiteLabel },
      { feature: "Lead capture forms", getValue: (p) => p.features.leadCapture },
      { feature: "Commercial license", getValue: (p) => p.features.commercialLicense },
    ],
  },
  {
    label: "Enterprise",
    rows: [
      { feature: "API access", getValue: (p) => p.features.apiAccess },
      { feature: "SSO integration", getValue: (p) => p.features.ssoIntegration },
      { feature: "Dedicated infrastructure", getValue: (p) => p.features.dedicatedInfra },
      { feature: "Priority support", getValue: (p) => p.features.prioritySupport },
    ],
  },
]

interface ComparisonMatrixProps {
  plans: Plan[]
}

function renderCell(value: string | boolean) {
  if (typeof value === "string") return <span className="text-sm">{value}</span>
  return value ? (
    <Check className="mx-auto h-4 w-4 text-primary" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
  )
}

export function ComparisonMatrix({ plans }: ComparisonMatrixProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/50">
      <table className="w-full text-left text-sm">
        <thead className="bg-card/60">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-foreground">Compare</th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-4 py-3 text-center font-semibold">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map((section) => (
            <tbody key={section.label} className="border-t border-border/50">
              <tr>
                <td
                  colSpan={plans.length + 1}
                  className="bg-secondary/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {section.label}
                </td>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.feature} className="border-t border-border/30">
                  <td className="px-4 py-3">{row.feature}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-4 py-3 text-center">
                      {renderCell(row.getValue(plan))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </tbody>
      </table>
    </div>
  )
}
