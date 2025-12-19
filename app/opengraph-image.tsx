import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'StepSnip - Turn YouTube Videos into Articles & Guides'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    // Read the logo file
    const logoData = await fetch(
        new URL('../public/web-app-manifest-512x512.png', import.meta.url)
    ).then((res) => res.arrayBuffer())

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
                    backgroundColor: '#000',
                    backgroundImage: 'linear-gradient(to bottom right, #000 0%, #111 100%)',
                    color: 'white',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 40,
                    }}
                >
                    {/* Logo */}
                    <img
                        // @ts-ignore
                        src={logoData}
                        alt="StepSnip Logo"
                        width="200"
                        height="200"
                        style={{
                            borderRadius: '32px',
                        }}
                    />
                    {/* Title */}
                    <div
                        style={{
                            fontSize: 80,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            letterSpacing: '-0.05em',
                        }}
                    >
                        StepSnip
                    </div>
                    {/* Description */}
                    <div
                        style={{
                            fontSize: 32,
                            color: '#888',
                            textAlign: 'center',
                            maxWidth: 800,
                        }}
                    >
                        Turn YouTube Videos into Structured Articles & Guides
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
