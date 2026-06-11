import { Palette, Layers, Zap, Share2, Shield, Smartphone, Cloud, Users } from "lucide-react"

const features = [
  {
    name: "Real-time Preview",
    description: "See your customizations come to life instantly with our real-time 3D rendering engine.",
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
  },
  {
    name: "Color Studio",
    description: "Choose from thousands of colors or create custom shades for your perfect finish.",
    icon: Palette,
    color: "bg-pink-50 text-pink-600",
  },
  {
    name: "Accessory Library",
    description: "Browse and apply accessories from our extensive catalog of OEM and aftermarket parts.",
    icon: Layers,
    color: "bg-violet-50 text-violet-600",
  },
  {
    name: "Easy Sharing",
    description: "Share your designs with friends, family, or dealers with a single click.",
    icon: Share2,
    color: "bg-sky-50 text-sky-600",
  },
  {
    name: "Secure Storage",
    description: "All your designs are securely stored in the cloud with enterprise-grade encryption.",
    icon: Shield,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    name: "Mobile Ready",
    description: "Access your projects from any device with our fully responsive platform.",
    icon: Smartphone,
    color: "bg-orange-50 text-orange-600",
  },
  {
    name: "Cloud Sync",
    description: "Your work is automatically saved and synced across all your devices.",
    icon: Cloud,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    name: "Team Collaboration",
    description: "Work together with your team on designs with real-time collaboration features.",
    icon: Users,
    color: "bg-indigo-50 text-indigo-600",
  },
]

export function Features() {
  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to design
          </h2>
          <p className="mt-4 text-pretty text-lg text-gray-500">
            Powerful tools that make car customization simple, fast, and fun.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{feature.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
