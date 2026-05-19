import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autovisionpro.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/team/invite/',
          '/(protected)/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
