import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import "./globals.css";

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "StepSnip - Turn YouTube Videos into Articles & Guides with AI",
    template: "%s | StepSnip"
  },
  description: "Stop pausing and typing. StepSnip automatically converts YouTube videos into structured articles, step-by-step guides, and blog posts with screenshots. Turn watch time into read time.",
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
    canonical: './',
    languages: {
      'en': './',
      'x-default': './'
    },
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
