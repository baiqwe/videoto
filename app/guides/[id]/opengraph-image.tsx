import { ImageResponse } from 'next/og'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'edge'

export const alt = 'StepSnip Guide'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient() // Create client for edge

    const { data: project } = await supabase
        .from('projects')
        .select('title')
        .eq('id', id)
        .single()

    const title = project?.title || 'Video Guide'

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    backgroundImage: 'linear-gradient(to bottom right, #ffffff 0%, #f0f0f0 100%)',
                    color: '#000',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 30,
                            marginBottom: 30,
                            color: '#666',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                        }}
                    >
                        StepSnip Guide
                    </div>
                    <div
                        style={{
                            fontSize: 70,
                            fontWeight: 900,
                            lineHeight: 1.1,
                            marginBottom: 20,
                            maxWidth: 1000,
                            display: 'flex',

                            // Emulate line-clamp/wrapping
                            wordWrap: 'break-word',
                        }}
                    >
                        {title}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
