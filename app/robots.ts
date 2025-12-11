import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://你的域名.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            // 保护用户隐私，不收录 Dashboard 和 API
            disallow: ['/dashboard/', '/api/', '/profile/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
