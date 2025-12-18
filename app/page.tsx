"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import VideoInputForm from "@/components/video-input-form";
import { ExampleShowcase } from "@/components/landing/example-showcase";
import { CheckCircle2, FileText, Zap, Image as ImageIcon, Sparkles, Youtube, ArrowRight } from "lucide-react";

interface CreateProjectData {
  videoSourceUrl: string;
  title?: string;
  generationMode?: 'text_only' | 'text_with_images';
}

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: CreateProjectData) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate a guide.",
        variant: "default",
      });
      router.push('/sign-in');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoSourceUrl: formData.videoSourceUrl,
          title: formData.title || undefined,
          generationMode: formData.generationMode || 'text_with_images',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Insufficient credits",
            description: "Please upgrade your plan to continue.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || 'Failed to create project');
      }

      toast({
        title: "Project created!",
        description: "Your video is being processed.",
      });

      router.push(`/guides/${data.project.id}`);
    } catch (error) {
      console.error('Create project error:', error);
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "StepSnip",
            "applicationCategory": "ProductivityApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "description": "Convert YouTube videos into step-by-step guides with AI."
          })
        }}
      />
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                🎉 New: Get 30 Free Credits on Sign Up
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
                Joined by 5,000+ Visual Learners & Developers
              </p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl"
            >
              Stop Pausing YouTube. <br />
              <span className="text-primary italic">Start Learning in Seconds.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl"
            >
              Instantly transform any YouTube tutorial into a structured, searchable guide with AI-captured screenshots. Skim the tutorial. <span className="text-foreground font-semibold underline decoration-primary/30">Skip the fluff.</span>
            </motion.p>

            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-2xl mt-8"
            >
              <div className="bg-card p-2 rounded-xl shadow-lg border relative z-10">
                <VideoInputForm onCreate={handleCreate} isCreating={isCreating} />
              </div>
              <p className="text-sm text-foreground mt-4 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required. <span className="text-muted-foreground font-normal">Free 30 credits included.</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Stop Wasting Hours on Manual Notes</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We do the heavy lifting. You get the knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl -z-10 group-hover:scale-105 transition-transform duration-500" />
              <div className="bg-card border rounded-2xl p-8 h-full flex flex-col items-center text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-2">
                  <Youtube className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">1. Drop the Link</h3>
                <p className="text-muted-foreground">
                  Paste any YouTube tutorial. Our AI starts "watching" immediately.
                </p>
              </div>
              {/* Connector */}
              <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20 text-muted-foreground/30">
                <ArrowRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl -z-10 group-hover:scale-105 transition-transform duration-500" />
              <div className="bg-card border rounded-2xl p-8 h-full flex flex-col items-center text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold">2. AI "Sees" the Steps</h3>
                <p className="text-muted-foreground">
                  Beyond transcription—we capture the exact frames where the magic happens.
                </p>
              </div>
              {/* Connector */}
              <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20 text-muted-foreground/30">
                <ArrowRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl -z-10 group-hover:scale-105 transition-transform duration-500" />
              <div className="bg-card border rounded-2xl p-8 h-full flex flex-col items-center text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-2">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">3. Learn in Seconds</h3>
                <p className="text-muted-foreground">
                  Get a searchable, skimmable article. Export to Notion, Obsidian, or PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Showcase */}
      <ExampleShowcase />

      {/* Benefits Section */}
      <section className="py-20 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="w-6 h-6" />, title: "Forget the Fluff", desc: "Get the 2-minute summary of a 30-minute rambling video." },
              { icon: <ImageIcon className="w-6 h-6" />, title: "Perfect Frame Capture", desc: "Never squint at blurry timestamps again. We grab the 4K source." },
              { icon: <FileText className="w-6 h-6" />, title: "Developer Ready", desc: "Markdown and HTML export. Perfect for documentation." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit text-primary">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
