import Link from "next/link"
import { Car, Mail } from "lucide-react"

const footerLinks = {
  product: [
    { name: "Features",        href: "/#features",  title: "Explore AutoVision Pro's car customization features" },
    { name: "Pricing",         href: "/pricing",     title: "View AutoVision Pro pricing plans" },
    { name: "Dashboard",       href: "/dashboard",   title: "Go to your AutoVision Pro dashboard" },
    { name: "Advertise",       href: "/#advertise",  title: "Advertise your shop or dealership on AutoVision Pro" },
  ],
  services: [
    { name: "Ad Creative Design",    href: "/dashboard?tab=design-service", title: "Get a professional ad creative designed" },
    { name: "Website Building",      href: "/services/website",             title: "Website building services for automotive businesses" },
    { name: "Advertising Platform",  href: "/#advertise",                   title: "Advertise your shop or dealership on AutoVision Pro" },
  ],
  company: [
    { name: "About",   href: "/about",   title: "About AutoVision Pro" },
    { name: "Contact", href: "/contact", title: "Contact the AutoVision Pro team" },
    { name: "FAQ",     href: "/faq",     title: "Frequently asked questions" },
  ],
  legal: [
    { name: "Privacy Policy",    href: "/privacy", title: "AutoVision Pro privacy policy" },
    { name: "Terms & Conditions", href: "/terms",   title: "AutoVision Pro terms and conditions" },
    { name: "Refund Policy",     href: "/refund",   title: "AutoVision Pro refund policy" },
    { name: "Cookie Policy",     href: "/cookies",  title: "AutoVision Pro cookie policy" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">

          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" title="AutoVision Pro home" className="flex items-center gap-2">
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
              title="Email AutoVision Pro support"
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
                      title={link.title}
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
              { name: "Privacy",  href: "/privacy", title: "AutoVision Pro privacy policy" },
              { name: "Terms",    href: "/terms",    title: "AutoVision Pro terms and conditions" },
              { name: "Refunds",  href: "/refund",   title: "AutoVision Pro refund policy" },
              { name: "Cookies",  href: "/cookies",  title: "AutoVision Pro cookie policy" },
            ].map((l) => (
              <Link key={l.href} href={l.href} title={l.title} className="hover:text-primary transition-colors">
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
