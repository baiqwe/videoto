"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

import VideoInputForm from "@/components/product/generator/video-input-form";

interface CreateProjectData {
  videoSourceUrl: string;
  title?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  
  // UI state
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
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-muted/20 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-primary/10 text-primary mb-4">
                <span className="mr-2">🎬</span>
                AI-Powered Video to Guide Conversion
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Turn Any Video into a
                <br />
                <span className="text-primary">Visual Step-by-Step Guide</span>
              </h1>
              
              <p className="mt-6 text-xl text-muted-foreground md:text-2xl max-w-3xl mx-auto">
                Automatically extract key steps from your videos with AI-powered analysis and precise screenshots. Perfect for tutorials, guides, and documentation.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={() => {
                    const formSection = document.querySelector('[data-video-input-form]');
                    if (formSection) {
                      formSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  {loading ? 'Loading...' : !user ? '🔒 Sign In to Start' : '🎯 Create Guide'}
                </button>
                <button
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium border border-border text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  View My Projects
                </button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  AI-powered step detection
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Automatic screenshots
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Export to Markdown/HTML
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Create Your Video Guide
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Simply paste a YouTube URL and let our AI do the work. We'll analyze the video, extract key steps, and generate a beautiful step-by-step guide.
                </p>
              </div>

              <div id="video-input-form" data-video-input-form>
                <VideoInputForm 
                  onCreate={handleCreate}
                  isCreating={isCreating}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl space-y-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Why Choose VidStep?
              </h2>
              <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
                Transform your video content into professional documentation with AI-powered analysis and automatic screenshot capture.
              </p>
            </motion.div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">AI-Powered Analysis</h3>
                  <p className="text-muted-foreground">
                    Our advanced AI understands video content and automatically identifies key steps and important moments.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Precise Screenshots</h3>
                  <p className="text-muted-foreground">
                    Automatically capture high-quality screenshots at the perfect moments for each step.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Fast Processing</h3>
                  <p className="text-muted-foreground">
                    Get your step-by-step guide in minutes. Perfect for content creators who need quick turnaround.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Start Creating Guides Today
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                Transform your video tutorials into professional documentation that's easy to follow and share.
                <br />
                Join creators who are making their content more accessible.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button 
                  onClick={() => {
                    const formSection = document.querySelector('[data-video-input-form]');
                    if (formSection) {
                      formSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  {loading ? 'Loading...' : !user ? '🔒 Sign In to Start' : '🎯 Create Your First Guide'}
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Dashboard →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
