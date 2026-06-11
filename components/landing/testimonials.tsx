import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    content: "AutoVision Pro helped me visualize exactly what I wanted before ordering. The dealer was impressed with my detailed specifications!",
    author: "Sarah Chen",
    role: "Car Enthusiast",
    initials: "SC",
    color: "bg-violet-100 text-violet-700",
    rating: 5,
  },
  {
    content: "As a dealer, this platform has revolutionized how we present options to customers. Sales conversations are so much more productive now.",
    author: "Michael Rodriguez",
    role: "Dealership Owner",
    initials: "MR",
    color: "bg-sky-100 text-sky-700",
    rating: 5,
  },
  {
    content: "The real-time 3D preview is incredible. I spent hours customizing my dream car and ended up ordering exactly what I designed!",
    author: "James Wilson",
    role: "First-time Buyer",
    initials: "JW",
    color: "bg-emerald-100 text-emerald-700",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Testimonials</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Loved by car enthusiasts
          </h2>
          <p className="mt-4 text-pretty text-lg text-gray-500">
            Join thousands of satisfied users who have designed their perfect ride.
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
