import type { Region } from "@/lib/region"

interface FAQItem {
  q: string
  a: string
}

interface DeepDiveContent {
  eyebrow: string
  title: string
  paragraphs: string[]
  faqTitle: string
  faqs: FAQItem[]
}

const CONTENT_BY_REGION: Record<Region, DeepDiveContent> = {
  us: {
    eyebrow: "Why AutoVision Pro",
    title: "Built for the American wrap and customization industry",
    paragraphs: [
      "From coast-to-coast wrap shops running a dozen bays to a single installer working out of a garage in the Midwest, American businesses use AutoVision Pro to close deals before a single roll of vinyl is cut. Full wraps, color-matched panels, chrome deletes, and matte conversions can all be mocked up in minutes, so a customer sees exactly what they're paying for before committing a deposit.",
      "Dealerships use the platform a little differently — sales teams pull up a customer's exact trim, then walk through wheel packages, tint options, and accessory add-ons on a showroom tablet instead of a paper brochure. It shortens the sales cycle and gives buyers confidence that what they're picturing on screen is what they'll actually drive away in.",
      "Because every plan is billed in USD through PayPal, there's no currency guesswork for shops anywhere from Texas to California. AI credits cover background removal, part detection, and color-theme generation, so even solo installers get access to tools that used to require hiring a design agency.",
      "AutoVision Pro is used across every segment of the market — from vinyl wrap installers and window tint shops to used-car dealerships prepping inventory photos for their website. Whatever the storefront looks like, the workflow is the same: upload a photo of the vehicle, let the AI detect each panel, then experiment with colors, finishes, and accessories until the client signs off.",
    ],
    faqTitle: "Common questions from US shops",
    faqs: [
      {
        q: "Do I need design experience to use AutoVision Pro?",
        a: "No. The interface is built for shop owners and sales staff, not graphic designers — most teams create their first mockup within minutes of signing up.",
      },
      {
        q: "Does this replace my vinyl installer or PPF technician?",
        a: "No — AutoVision Pro is a design and sales tool that sits before the install. You still do the physical wrap or paint protection film work; we just help you sell and plan it.",
      },
      {
        q: "Can I use it on a tablet on the showroom floor?",
        a: "Yes. The whole platform is fully responsive and works on any modern browser, whether that's a shop iPad, a laptop at the front desk, or a phone in the parking lot.",
      },
      {
        q: "What happens if I run out of AI credits?",
        a: "You can top up any time with a one-time credit pack, or upgrade your monthly plan — credits from packs never expire and roll over.",
      },
      {
        q: "Which car makes and models does it support?",
        a: "Any vehicle you can photograph. The AI part-detection model works from the uploaded image rather than a fixed database, so it handles everything from a daily-driver sedan to a custom off-road build.",
      },
    ],
  },
  in: {
    eyebrow: "Kyun AutoVision Pro",
    title: "India ke automotive market ke liye banaya gaya",
    paragraphs: [
      "Chhote garage se lekar multi-city wrap chains tak, India bhar ke automotive businesses AutoVision Pro use karte hain taaki client ko deal confirm karne se pehle hi pura design dikha sakein. Full body wrap, colour change, matte finish — sab kuch minutes mein mock-up ho jaata hai, aur customer apna paisa kharch karne se pehle exact result dekh sakta hai.",
      "Dealerships apne showroom mein customer ko unki exact car model par wheel packages, accessories, aur colour options live dikhate hain — isse sales conversation kaafi zyada convincing ban jaati hai, aur customer confidently decision le paata hai bina kisi confusion ke.",
      "Saare plans INR mein billed hote hain, toh currency ki koi confusion nahi rehti. AI credits se background removal, part detection, aur colour-theme generation jaise tools mil jaate hain — jo pehle sirf badi design agencies ke paas hote the, ab ek solo designer bhi easily use kar sakta hai.",
      "AutoVision Pro alag-alag segments mein use hota hai — vinyl wrap installers se lekar used-car dealerships tak jo apni inventory ki photos website ke liye taiyar karte hain. Workflow simple hai: gaadi ki photo upload karein, AI har panel detect karega, phir colours, finishes, aur accessories try karke client se approval le lein. Chhote towns ke garages ho ya metro city ke premium wrap studios, sabko ek hi tool mein full flexibility milti hai.",
    ],
    faqTitle: "Indian shops ke common sawaal",
    faqs: [
      {
        q: "Kya mujhe design ka experience chahiye?",
        a: "Bilkul nahi. Interface itna simple hai ki shop owner ya sales staff bhi pehle hi din apna pehla mockup bana lete hain.",
      },
      {
        q: "Kya yeh mera wrap installer replace kar dega?",
        a: "Nahi — AutoVision Pro sirf design aur sales ka tool hai. Actual wrap ya paint ka kaam aap khud karte hain, hum sirf usse pitch karne mein madad karte hain.",
      },
      {
        q: "Kya main ise tablet ya mobile par use kar sakta hoon?",
        a: "Haan, poora platform fully responsive hai — chahe showroom ka tablet ho, ya aapka phone.",
      },
      {
        q: "Agar AI credits khatam ho jaayein toh?",
        a: "Aap kabhi bhi ek-baar ka credit pack kharid sakte hain, ya apna monthly plan upgrade kar sakte hain — pack ke credits kabhi expire nahi hote.",
      },
      {
        q: "Kya yeh sab car makes aur models support karta hai?",
        a: "Jo bhi gaadi aap photo kheench sakte hain, uspar kaam karta hai. AI part-detection model fixed database par nahi, balki upload ki gayi photo par kaam karta hai — chahe daily-driver sedan ho ya custom build.",
      },
    ],
  },
  uk: {
    eyebrow: "Why AutoVision Pro",
    title: "Built for the UK wrap and customisation industry",
    paragraphs: [
      "From independent detailing studios in London to multi-bay bodyshops in Manchester and Birmingham, UK businesses use AutoVision Pro to agree the design with a customer before a single panel is touched. Full wraps, colour changes, matte conversions, and alloy refinishing can all be mocked up in minutes, giving the customer a clear picture of the finished job before they commit.",
      "Dealerships use it to walk a customer through trim, wheel, and colour options on a showroom tablet rather than a printed brochure — it shortens the sales conversation and gives buyers confidence in exactly what they're ordering, without any surprises at collection.",
      "Prices on this page are shown in GBP for reference, though checkout currently runs through our USD PayPal billing — so there's no separate GBP invoice to reconcile, just one predictable monthly or annual charge. AI credits cover background removal, part detection, and colour-theme generation, giving even a one-person studio the tools of a full design team.",
      "AutoVision Pro is used across every part of the trade — from vinyl wrap installers and window tinting studios to used-car dealers preparing stock photos for their website. The workflow stays the same throughout: upload a photo of the vehicle, let the AI detect each panel, then experiment with colours, finishes, and accessories until the customer signs off.",
    ],
    faqTitle: "Common questions from UK shops",
    faqs: [
      {
        q: "Do I need design experience to use AutoVision Pro?",
        a: "No — the interface is built for shop owners and sales staff, not graphic designers. Most teams create their first mock-up within minutes of signing up.",
      },
      {
        q: "Does this replace my wrap installer or bodyshop?",
        a: "No — AutoVision Pro is a design and sales tool that sits before the install. You still carry out the physical wrap or respray; we help you sell and plan it.",
      },
      {
        q: "Can I use it on a tablet in the showroom?",
        a: "Yes. The whole platform is fully responsive and works in any modern browser — a showroom tablet, a laptop on the front desk, or your phone.",
      },
      {
        q: "What happens if I run out of AI credits?",
        a: "You can top up any time with a one-off credit pack, or upgrade your plan — credits from packs never expire and roll over.",
      },
      {
        q: "Which car makes and models does it support?",
        a: "Any vehicle you can photograph. The AI part-detection model works from the uploaded image rather than a fixed database, so it handles everything from a daily-driver hatchback to a custom off-road build.",
      },
    ],
  },
}

interface Props {
  region: Region
}

export function RegionalDeepDive({ region }: Props) {
  const content = CONTENT_BY_REGION[region]

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-primary">
          {content.eyebrow}
        </p>
        <h2 className="mt-3 text-balance text-center text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {content.title}
        </h2>

        <div className="mt-10 space-y-5">
          {content.paragraphs.map((p, i) => (
            <p key={i} className="text-pretty leading-relaxed text-gray-600">
              {p}
            </p>
          ))}
        </div>

        <h3 className="mt-16 text-center text-2xl font-bold text-gray-900">{content.faqTitle}</h3>
        <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {content.faqs.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-medium text-gray-900">
                <span>{item.q}</span>
                <span className="shrink-0 text-gray-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
