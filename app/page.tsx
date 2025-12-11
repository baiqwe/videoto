"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import VideoInputForm from "@/components/product/generator/video-input-form";
import { ArrowRight, FileText, Zap, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface CreateProjectData {
  videoSourceUrl: string;
  title?: string;
  generationMode?: 'text_only' | 'text_with_images';
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: CreateProjectData) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a project.",
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
            description: data.error || "Please purchase more credits to continue.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }
        throw new Error(data.error || 'Failed to create project');
      }

      toast({
        title: "Project created!",
        description: data.message || "Your video is being processed. This may take a few minutes.",
      });

      // Navigate to project page
      router.push(`/guides/${data.project.id}`);
    } catch (error) {
      console.error('Create project error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Failed to create project",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* 1. Hero Section - The "Hook" */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">

            {/* 品牌标签 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Introducing StepSnip 1.0
            </motion.div>

            {/* 主标题 - SEO 核心 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl"
            >
              Turn Video Content into <br />
              <span className="text-primary">Structured Documentation</span>
            </motion.h1>

            {/* 副标题 - 痛点描述 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl"
            >
              StepSnip transforms YouTube tutorials into clean, step-by-step articles with screenshots.
              Perfect for developers, writers, and learners.
            </motion.p>

            {/* 核心功能区 - Video Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-2xl mt-8"
            >
              <div className="bg-card p-2 rounded-xl shadow-lg border">
                <VideoInputForm onCreate={handleCreate} isCreating={isCreating} />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Try: Tutorials, Product Reviews, or Educational Lectures.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Visual Value Proposition - "What you get" */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                From <span className="text-red-500">Video Chaos</span> to <span className="text-primary">Document Clarity</span>
              </h2>
              <div className="space-y-4">
                {[
                  { title: "AI Summarization", desc: "Gemini 1.5 Pro analyzes context and extracts key insights." },
                  { title: "Smart Screenshots", desc: "Automatically captures HD frames at crucial steps." },
                  { title: "SEO Ready", desc: "Outputs formatted Markdown/HTML ready for your blog." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Demo Mockup */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-background rounded-xl border shadow-2xl overflow-hidden aspect-video flex">
                {/* Left: Video Player representation */}
                <div className="w-1/3 bg-black flex items-center justify-center border-r">
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                  </div>
                </div>
                {/* Right: Document representation */}
                <div className="w-2/3 p-6 space-y-3 bg-white dark:bg-zinc-950">
                  <div className="h-6 w-3/4 bg-primary/20 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-5/6 bg-muted rounded"></div>
                    <div className="h-3 w-full bg-muted rounded"></div>
                  </div>
                  <div className="h-24 w-full bg-muted/50 rounded border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                    [Smart Screenshot]
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-4/5 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Use Cases - Targeting specific Personas (SEO) */}
      <section className="py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Built for Content Creators & Builders</h2>
            <p className="text-muted-foreground mt-4">Why users choose StepSnip for their workflow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<FileText className="w-6 h-6" />}
              title="For Bloggers"
              desc="Repurpose your YouTube content into SEO-friendly blog posts in seconds. Multiply your traffic sources."
            />
            <UseCaseCard
              icon={<Zap className="w-6 h-6" />}
              title="For Developers"
              desc="Convert coding tutorials into copy-pasteable documentation. Stop pausing video to read code."
            />
            <UseCaseCard
              icon={<ImageIcon className="w-6 h-6" />}
              title="For Students"
              desc="Turn 1-hour lectures into 5-minute reading summaries with key slides captured automatically."
            />
          </div>
        </div>
      </section>

      {/* 4. SEO Content Block (FAQ) - Hidden gem for Google */}
      <section className="py-20 bg-muted/10 border-t">
        <div className="container px-4 md:px-6 max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              q="How does StepSnip convert video to text?"
              a="StepSnip uses advanced AI (Gemini 1.5 Pro) to analyze both the visual and audio components of a YouTube video. It then synthesizes this information into a structured article, capturing screenshots at key moments."
            />
            <FAQItem
              q="Can I use this for SEO content generation?"
              a="Absolutely. StepSnip generates clean, structured Markdown that is perfect for blog posts. You can edit the output and publish it to boost your site's SEO."
            />
            <FAQItem
              q="What is the difference between a transcript and a StepSnip guide?"
              a="A transcript is just raw text. A StepSnip guide is a curated article with headings, paragraphs, and visual screenshots, designed to be read, not just searched."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 border-t">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your content?</h2>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
          >
            Create Your First Vidoc
          </button>
        </div>
      </section>
    </div>
  );
}

// 辅助组件：保持主文件整洁
function UseCaseCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}

function FAQItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-lg">{q}</h4>
      <p className="text-muted-foreground">{a}</p>
    </div>
  );
}
