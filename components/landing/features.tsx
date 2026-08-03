import { Palette, Layers, Zap, Share2, Shield, Smartphone, Cloud, Users } from "lucide-react"
import type { Region } from "@/lib/region"

const ICONS = [Zap, Palette, Layers, Share2, Shield, Smartphone, Cloud, Users]
const COLORS = [
  "bg-amber-50 text-amber-600",
  "bg-pink-50 text-pink-600",
  "bg-violet-50 text-violet-600",
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
  "bg-cyan-50 text-cyan-600",
  "bg-indigo-50 text-indigo-600",
]

interface FeatureItem {
  name: string
  description: string
}

interface FeaturesHeader {
  eyebrow: string
  title: string
  subtitle: string
}

const HEADER_BY_REGION: Record<Region, FeaturesHeader> = {
  us: {
    eyebrow: "Features",
    title: "Everything you need to design",
    subtitle:
      "Powerful tools that make car customization simple, fast, and fun for American wrap shops and dealerships.",
  },
  in: {
    eyebrow: "Features",
    title: "Design ke liye sab kuch, ek jagah",
    subtitle:
      "Powerful AI tools jo car customization ko simple, fast, aur fun banate hain — Indian wrap shops aur garages ke liye banaya gaya.",
  },
  uk: {
    eyebrow: "Features",
    title: "Everything you need to design",
    subtitle:
      "Powerful tools that make car customisation simple, fast, and fun for UK wrap shops and dealerships.",
  },
}

const FEATURES_BY_REGION: Record<Region, FeatureItem[]> = {
  us: [
    {
      name: "Real-time Preview",
      description:
        "See your customizations come to life instantly with our real-time 3D rendering engine — built to keep pace with fast-moving American dealership floors.",
    },
    {
      name: "Color Studio",
      description:
        "Choose from thousands of factory and custom finishes, from Californian matte wraps to Midwest classic gloss, and preview them before a single sheet of vinyl is cut.",
    },
    {
      name: "Accessory Library",
      description:
        "Browse OEM and aftermarket parts for everything from lifted trucks to lowered imports, sourced from the catalogs American installers already trust.",
    },
    {
      name: "Easy Sharing",
      description:
        "Send a shareable link to a customer's phone so they can review the wrap, rims, or color swap with family before signing off on the invoice.",
    },
    {
      name: "Secure Storage",
      description:
        "Every project is encrypted and backed up in the cloud, so a shop's design history survives even if a laptop gets left in the service bay.",
    },
    {
      name: "Mobile Ready",
      description:
        "Pull up a client's design on the showroom iPad or your phone at a car show — the whole platform is fully responsive, no app install required.",
    },
    {
      name: "Cloud Sync",
      description:
        "Start a mockup on the front desk computer and finish it on your phone in the parking lot; changes sync automatically across every device.",
    },
    {
      name: "Team Collaboration",
      description:
        "Give your whole install team — sales, design, and the shop floor — access to the same live project so nobody's working off an outdated version.",
    },
  ],
  in: [
    {
      name: "Real-time Preview",
      description:
        "Apni customization turant live dekhein — real-time 3D rendering engine se, jo Mumbai se Bangalore tak har garage ke liye fast kaam karta hai.",
    },
    {
      name: "Color Studio",
      description:
        "Hazaaron colours mein se choose karein ya apna custom shade banayein — matte se lekar chrome tak, delivery se pehle hi preview kar lein.",
    },
    {
      name: "Accessory Library",
      description:
        "OEM aur aftermarket parts ki poori library — Maruti, Tata, Mahindra jaisi popular Indian cars ke liye bhi ready-made options.",
    },
    {
      name: "Easy Sharing",
      description:
        "Client ke WhatsApp par ek click mein design bhej dein — approval milna ab kaafi tez ho jaata hai, deal close karna aasan.",
    },
    {
      name: "Secure Storage",
      description:
        "Aapke saare designs cloud mein securely store hote hain — enterprise-grade encryption ke saath, kabhi data loss ki tension nahi.",
    },
    {
      name: "Mobile Ready",
      description:
        "Kisi bhi device se apna project access karein — chhoti dukaan ho ya bada showroom, platform har screen par smooth chalta hai.",
    },
    {
      name: "Cloud Sync",
      description:
        "Front desk se shuru kiya kaam automatically sync hoke phone par bhi mil jaata hai — kahin bhi continue karein.",
    },
    {
      name: "Team Collaboration",
      description:
        "Apni poori team ko ek hi project par kaam karne dein — sales se lekar design tak, sabko real-time updates milte hain.",
    },
  ],
  uk: [
    {
      name: "Real-time Preview",
      description:
        "Watch your customisation come to life instantly with our real-time 3D rendering engine, built to keep pace with a busy UK bodyshop's schedule.",
    },
    {
      name: "Colour Studio",
      description:
        "Pick from thousands of finishes — from a classic British Racing Green to a bold matte wrap — and preview the result before any vinyl is cut.",
    },
    {
      name: "Accessory Library",
      description:
        "Browse OEM and aftermarket parts covering everything from a Land Rover Defender to a hot hatch, sourced from catalogues UK installers already trust.",
    },
    {
      name: "Easy Sharing",
      description:
        "Send a shareable link straight to a customer's phone so they can sign off on a wrap or colour change before you book the bay.",
    },
    {
      name: "Secure Storage",
      description:
        "Every project is encrypted and backed up in the cloud, so your design history is safe even if a laptop gets left on the workshop bench.",
    },
    {
      name: "Mobile Ready",
      description:
        "Bring up a customer's design on the showroom tablet or your own phone — the whole platform is fully responsive, no app to install.",
    },
    {
      name: "Cloud Sync",
      description:
        "Start a mock-up on the front desk PC and finish it on your phone at the next car meet; everything syncs automatically.",
    },
    {
      name: "Team Collaboration",
      description:
        "Give your whole team — sales, design, and the workshop floor — access to the same live project so nobody's working from an old version.",
    },
  ],
}

interface Props {
  region: Region
}

export function Features({ region }: Props) {
  const header = HEADER_BY_REGION[region]
  const features = FEATURES_BY_REGION[region]

  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{header.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {header.title}
          </h2>
          <p className="mt-4 text-pretty text-lg text-gray-500">
            {header.subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = ICONS[i]
            return (
              <div
                key={feature.name}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${COLORS[i]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
