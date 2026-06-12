import Link from "next/link"
import { Car, Mail } from "lucide-react"

const footerLinks = {
  product: [
    { name: "Features",        href: "/#features" },
    { name: "Pricing",         href: "/pricing" },
    { name: "Dashboard",       href: "/dashboard" },
    { name: "Advertise",       href: "/#advertise" },
  ],
  services: [
    { name: "Ad Creative Design",    href: "/dashboard?tab=design-service" },
    { name: "Website Building",      href: "/services/website" },
    { name: "Advertising Platform",  href: "/#advertise" },
  ],
  company: [
    { name: "About",   href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ",     href: "/faq" },
  ],
  legal: [
    { name: "Privacy Policy",    href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy",     href: "/refund" },
    { name: "Cookie Policy",     href: "/cookies" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">

          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">AutoVision Pro</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              AI-powered car customization for enthusiasts, wrap shops, and automotive businesses.
            </p>
            <a
              href="mailto:autovisionpro07@gmail.com"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              autovisionpro07@gmail.com
            </a>
          </div>

          {/* Links */}
          {(["product", "services", "company", "legal"] as const).map((col) => (
            <div key={col}>
              <h3 className="mb-4 text-sm font-semibold capitalize text-gray-900">{col}</h3>
              <ul className="space-y-3">
                {footerLinks[col].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} AutoVision Pro. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            {[
              { name: "Privacy",  href: "/privacy" },
              { name: "Terms",    href: "/terms" },
              { name: "Refunds",  href: "/refund" },
              { name: "Cookies",  href: "/cookies" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-primary transition-colors">
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
