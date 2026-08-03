import { Star, Quote } from "lucide-react"
import type { Region } from "@/lib/region"

interface Testimonial {
  content: string
  author: string
  role: string
  initials: string
  color: string
  rating: number
}

interface TestimonialsHeader {
  eyebrow: string
  title: string
  subtitle: string
}

const HEADER_BY_REGION: Record<Region, TestimonialsHeader> = {
  us: {
    eyebrow: "Testimonials",
    title: "Loved by car enthusiasts",
    subtitle: "Join thousands of satisfied users who have designed their perfect ride.",
  },
  in: {
    eyebrow: "Testimonials",
    title: "Hazaaron users ka bharosa",
    subtitle: "India bhar ke wrap shops, dealerships aur car enthusiasts AutoVision Pro par trust karte hain.",
  },
  uk: {
    eyebrow: "Testimonials",
    title: "Trusted across the UK",
    subtitle: "Join wrap studios, dealerships, and car enthusiasts already designing with AutoVision Pro.",
  },
}

const TESTIMONIALS_BY_REGION: Record<Region, Testimonial[]> = {
  us: [
    {
      content:
        "AutoVision Pro helped me visualize exactly what I wanted before ordering. The dealer was impressed with my detailed specifications!",
      author: "Sarah Chen",
      role: "Car Enthusiast",
      initials: "SC",
      color: "bg-violet-100 text-violet-700",
      rating: 5,
    },
    {
      content:
        "As a dealer, this platform has revolutionized how we present options to customers. Sales conversations are so much more productive now.",
      author: "Michael Rodriguez",
      role: "Dealership Owner",
      initials: "MR",
      color: "bg-sky-100 text-sky-700",
      rating: 5,
    },
    {
      content:
        "The real-time 3D preview is incredible. I spent hours customizing my dream car and ended up ordering exactly what I designed!",
      author: "James Wilson",
      role: "First-time Buyer",
      initials: "JW",
      color: "bg-emerald-100 text-emerald-700",
      rating: 5,
    },
  ],
  in: [
    {
      content:
        "AutoVision Pro se clients ko design turant dikhana itna easy ho gaya hai. Ab woh apni gaadi ka look approve karke hi aate hain — kaam fast hota hai.",
      author: "Rohan Mehta",
      role: "Wrap Shop Owner, Mumbai",
      initials: "RM",
      color: "bg-violet-100 text-violet-700",
      rating: 5,
    },
    {
      content:
        "Hamare showroom mein ab har customer apni pasand ka colour aur accessories preview kar sakta hai. Sales pitch pehle se kahin zyada strong hai.",
      author: "Priya Sharma",
      role: "Dealership Manager, Delhi",
      initials: "PS",
      color: "bg-sky-100 text-sky-700",
      rating: 5,
    },
    {
      content:
        "Maine apni gaadi ke liye pura custom wrap design kiya, aur jab actual mein wrap hua toh bilkul waisa hi nikla jaisa maine socha tha!",
      author: "Arjun Nair",
      role: "Car Enthusiast, Bangalore",
      initials: "AN",
      color: "bg-emerald-100 text-emerald-700",
      rating: 5,
    },
  ],
  uk: [
    {
      content:
        "AutoVision Pro has completely changed how we pitch jobs. Customers approve their wrap on-screen before we even book them in — it's saved us hours every week.",
      author: "Oliver Bennett",
      role: "Wrap Studio Owner, London",
      initials: "OB",
      color: "bg-violet-100 text-violet-700",
      rating: 5,
    },
    {
      content:
        "Being able to show a customer their exact colour and accessory choices before they commit has made every sales conversation smoother.",
      author: "Charlotte Hughes",
      role: "Dealership Manager, Manchester",
      initials: "CH",
      color: "bg-sky-100 text-sky-700",
      rating: 5,
    },
    {
      content:
        "I designed a full wrap for my car down to the last decal, and when it was finally fitted, it matched the preview almost exactly.",
      author: "James Whitfield",
      role: "Car Enthusiast, Birmingham",
      initials: "JW",
      color: "bg-emerald-100 text-emerald-700",
      rating: 5,
    },
  ],
}

interface Props {
  region: Region
}

export function Testimonials({ region }: Props) {
  const header = HEADER_BY_REGION[region]
  const testimonials = TESTIMONIALS_BY_REGION[region]

  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28">
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

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-gray-100" />

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="mt-4 flex-1 text-gray-600 leading-relaxed">&ldquo;{t.content}&rdquo;</p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
