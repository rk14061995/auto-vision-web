const FAQ = [
  {
    q: "How do AI credits work?",
    a: "Each AI feature consumes a specific number of credits. Your plan refills your monthly bucket on the first of each cycle; unused monthly credits don't roll over but credits from one-time packs do, forever.",
  },
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. Upgrades take effect immediately with prorated pricing for the rest of your cycle. Downgrades schedule at the end of your current cycle, with a 3-day grace period.",
  },
  {
    q: "What happens if my AI generation fails?",
    a: "Failed AI calls are automatically refunded to your credit balance — you only pay for what works.",
  },
  {
    q: "Is the watermark removed on Free?",
    a: "Free exports include a small AutoVision watermark and are limited to 720p. Upgrading to Creator removes the watermark and unlocks 1080p.",
  },
  {
    q: "Do I get a commercial license?",
    a: "Pro and above include a commercial use license suitable for client work, dealer galleries, and paid social campaigns.",
  },
  {
    q: "How many people can collaborate?",
    a: "Studio includes 5 team seats with a shared workspace, brand kit, and client approval flow. Enterprise unlocks custom seats and SSO.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan gives you ongoing access to the editor with 3 active projects and 5 monthly AI credits — no time limit.",
  },
]

export function PricingFAQ() {
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-border/50 rounded-2xl border border-border/50 bg-card/40">
        {FAQ.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer items-center justify-between text-left font-medium">
              <span>{item.q}</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
