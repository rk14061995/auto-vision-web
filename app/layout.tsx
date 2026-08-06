import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { RouteChangeTracker } from '@/components/analytics/RouteChangeTracker'
import { WebVitals } from '@/components/analytics/WebVitals'
import { Suspense } from 'react'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autovision-pro.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AutoVision Pro - Virtual Car Customization Platform',
    template: '%s | AutoVision Pro',
  },
  description: 'Design your dream car with our advanced virtual customization tools. Preview colors, accessories, and modifications in stunning detail.',
  keywords: ['car customization', 'virtual car design', 'automotive', '3D car configurator', 'car color picker', 'vehicle customizer'],
  authors: [{ name: 'AutoVision Pro' }],
  creator: 'AutoVision Pro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'AutoVision Pro',
    title: 'AutoVision Pro - Virtual Car Customization Platform',
    description: 'Design your dream car with our advanced virtual customization tools. Preview colors, accessories, and modifications in stunning detail.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoVision Pro - Virtual Car Customization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoVision Pro - Virtual Car Customization Platform',
    description: 'Design your dream car with advanced virtual customization tools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64 48x48 32x32 16x16', type: 'image/x-icon' },
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AutoVision Pro',
  url: APP_URL,
  logo: `${APP_URL}/icon.svg`,
  description: 'AI-powered virtual car customization platform for wrap shops, dealerships, and automotive brands.',
  email: 'autovisionpro07@gmail.com',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AutoVision Pro',
  url: APP_URL,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.className} ${geistMono.className}`}>
      <body className="font-sans antialiased min-h-screen">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7690670457022729"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <GoogleAnalytics />
        <WebVitals />
        {/* RouteChangeTracker needs Suspense because it reads useSearchParams */}
        <Suspense fallback={null}>
          <RouteChangeTracker />
        </Suspense>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
