import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.stepsnip.com";


export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Free YouTube to Text Converter & Guide Generator | StepSnip",
    template: "%s | StepSnip"
  },
  description: "Convert YouTube videos to text, transcripts, and visual guides with AI. Free tool to turn tutorials into blog posts, documentation, and step-by-step articles with screenshots.",
  keywords: [
    "video to text",
    "YouTube to article",
    "AI guide generator",
    "video documentation",
    "content repurposing",
    "video to blog",
    "video summarizer",
    "automated documentation",
    "StepSnip"
  ],
  openGraph: {
    title: "StepSnip - Turn Videos into Docs",
    description: "Instantly create illustrated guides from any video. Transform YouTube tutorials into structured articles with AI-powered analysis.",
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "StepSnip",
  },
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'x-default': '/'
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StepSnip - Turn Videos into Docs",
    description: "Instantly create illustrated guides from any video. Transform YouTube tutorials into structured articles with AI.",
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-SJS92ZHFM7"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-SJS92ZHFM7');
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
