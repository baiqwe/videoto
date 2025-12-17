import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.stepsnip.com'
    const supabase = await createClient()

    // 1. Static routes
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/sign-in`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/explore`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
    ]

    // 2. Dynamic routes (projects)
    // Fetch latest 5000 completed guides
    const { data: guides } = await supabase
        .from('projects')
        .select('id, updated_at')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(5000)

    const guideRoutes = (guides || []).map((guide) => ({
        url: `${baseUrl}/guides/${guide.id}`,
        lastModified: new Date(guide.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [...staticRoutes, ...guideRoutes]
}
