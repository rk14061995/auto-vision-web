import { Star } from "lucide-react"

const testimonials = [
  {
    content:
      "AutoVision Pro helped me visualize exactly what I wanted before ordering. The dealer was impressed with my detailed specifications!",
    author: "Sarah Chen",
    role: "Car Enthusiast",
    rating: 5,
  },
  {
    content:
      "As a dealer, this platform has revolutionized how we present options to customers. Sales conversations are so much more productive now.",
    author: "Michael Rodriguez",
    role: "Dealership Owner",
    rating: 5,
  },
  {
    content:
      "The real-time 3D preview is incredible. I spent hours customizing my dream car and ended up ordering exactly what I designed!",
    author: "James Wilson",
    role: "First-time Buyer",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-card/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by car enthusiasts
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Join thousands of satisfied users who have designed their perfect ride.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="rounded-xl border border-border/50 bg-card p-8"
            >
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="mt-4 text-muted-foreground">{testimonial.content}</p>
              <div className="mt-6">
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
