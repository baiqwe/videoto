"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Share2, Download, Copy } from "lucide-react";

interface Step {
  id: string;
  stepOrder: number;
  title: string;
  description: string;
  timestampSeconds: number;
  imageUrl: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  title: string | null;
  videoSourceUrl: string;
  videoDurationSeconds: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  creditsCost: number;
  createdAt: string;
  updatedAt: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GuidePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Poll for updates if project is pending or processing
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data.project);
        setSteps(data.steps || []);
        
        // Stop loading if project is completed or failed
        if (data.project.status === 'completed' || data.project.status === 'failed') {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error",
          description: "Failed to load project. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchProject();

    // Poll every 3 seconds if project is pending or processing
    const interval = setInterval(() => {
      if (project?.status === 'pending' || project?.status === 'processing') {
        fetchProject();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId, project?.status, toast]);

  const exportToMarkdown = () => {
    if (!project || steps.length === 0) return;

    setIsExporting(true);
    try {
      let markdown = `# ${project.title || 'Video Guide'}\n\n`;
      markdown += `**Source:** ${project.videoSourceUrl}\n\n`;
      markdown += `---\n\n`;

      steps.forEach((step) => {
        markdown += `## ${step.title}\n\n`;
        if (step.imageUrl) {
          const fullImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.imageUrl}`;
          markdown += `![${step.title}](${fullImageUrl})\n\n`;
        }
        markdown += `${step.description}\n\n`;
        markdown += `*Timestamp: ${formatTime(step.timestampSeconds)}*\n\n`;
        markdown += `---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'guide'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Markdown file downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export markdown.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyMarkdown = async () => {
    if (!project || steps.length === 0) return;

    setIsExporting(true);
    try {
      let markdown = `# ${project.title || 'Video Guide'}\n\n`;
      markdown += `**Source:** ${project.videoSourceUrl}\n\n`;
      markdown += `---\n\n`;

      steps.forEach((step) => {
        markdown += `## ${step.title}\n\n`;
        if (step.imageUrl) {
          const fullImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.imageUrl}`;
          markdown += `![${step.title}](${fullImageUrl})\n\n`;
        }
        markdown += `${step.description}\n\n`;
        markdown += `*Timestamp: ${formatTime(step.timestampSeconds)}*\n\n`;
        markdown += `---\n\n`;
      });

      await navigator.clipboard.writeText(markdown);
      toast({
        title: "Success",
        description: "Markdown copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy markdown.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || project?.status === 'processing' || project?.status === 'pending') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="container max-w-5xl h-16 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>
        </div>
        <div className="container max-w-3xl py-20 space-y-8">
          <div className="space-y-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <h2 className="text-xl font-semibold">AI is analyzing your video...</h2>
            <p className="text-muted-foreground">This usually takes 1-2 minutes. We are extracting transcript, summarizing content, and capturing screenshots.</p>
          </div>
          <div className="space-y-12">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-8">
                <Skeleton className="w-1/2 h-64" />
                <div className="w-1/2 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (project?.status === 'failed') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold">Processing Failed</h2>
          <p className="text-muted-foreground">{project.errorMessage || "Please try a different video."}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-5xl h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyMarkdown}
              disabled={isExporting}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy MD
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast({title: "Link copied!", description: window.location.href})}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button 
              size="sm"
              onClick={exportToMarkdown}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* 文章主体 */}
      <article className="container max-w-3xl py-12">
        {/* 文章头部 */}
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            {project?.title || "Video Guide"}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <a 
              href={project?.videoSourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline text-primary flex items-center"
            >
              Watch Original Video
            </a>
            <span>•</span>
            <span>Generated by Vidoc</span>
          </div>
        </header>

        {/* 步骤内容 - 博客文章流 */}
        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.section 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* 步骤标题 */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {index + 1}
                </span>
                <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
              </div>

              {/* 核心内容区：如果有图，图在上方 */}
              <div className="pl-12 space-y-6">
                {step.imageUrl && (
                  <div className="rounded-xl overflow-hidden border shadow-sm bg-muted">
                    <img 
                      src={step.imageUrl} 
                      alt={step.title}
                      className="w-full h-auto object-cover transition-transform hover:scale-[1.02] duration-500" 
                    />
                  </div>
                )}
                
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed">
                  <p className="text-base">{step.description}</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-primary/70 bg-primary/5 w-fit px-3 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Timestamp: {formatTime(step.timestampSeconds)}
                </div>
              </div>
              
              {/* 连接线 (装饰) */}
              {index !== steps.length - 1 && (
                <div className="absolute left-4 top-12 bottom-[-4rem] w-px bg-border/50 -z-10" />
              )}
            </motion.section>
          ))}
        </div>
      </article>
    </div>
  );
}
