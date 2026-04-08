import {
  Palette,
  Layers,
  Zap,
  Share2,
  Shield,
  Smartphone,
  Cloud,
  Users,
} from "lucide-react"

const features = [
  {
    name: "Real-time Preview",
    description:
      "See your customizations come to life instantly with our real-time 3D rendering engine.",
    icon: Zap,
  },
  {
    name: "Color Studio",
    description:
      "Choose from thousands of colors or create custom shades for your perfect finish.",
    icon: Palette,
  },
  {
    name: "Accessory Library",
    description:
      "Browse and apply accessories from our extensive catalog of OEM and aftermarket parts.",
    icon: Layers,
  },
  {
    name: "Easy Sharing",
    description:
      "Share your designs with friends, family, or dealers with a single click.",
    icon: Share2,
  },
  {
    name: "Secure Storage",
    description:
      "All your designs are securely stored in the cloud with enterprise-grade encryption.",
    icon: Shield,
  },
  {
    name: "Mobile Ready",
    description:
      "Access your projects from any device with our fully responsive platform.",
    icon: Smartphone,
  },
  {
    name: "Cloud Sync",
    description:
      "Your work is automatically saved and synced across all your devices.",
    icon: Cloud,
  },
  {
    name: "Team Collaboration",
    description:
      "Work together with your team on designs with real-time collaboration features.",
    icon: Users,
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to design
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Powerful tools that make car customization simple, fast, and fun.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/50 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
