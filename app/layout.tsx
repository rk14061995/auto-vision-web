import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { RouteChangeTracker } from '@/components/analytics/RouteChangeTracker'
import { WebVitals } from '@/components/analytics/WebVitals'
import { Suspense } from 'react'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autovisionpro.com'

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
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen">
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
