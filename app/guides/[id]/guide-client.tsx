"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Share2, Download, Copy } from "lucide-react";

export interface Step {
    id: string;
    stepOrder: number;
    title: string;
    description: string;
    timestampSeconds: number;
    imageUrl: string | null;
    createdAt: string;
}

export interface Project {
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

export default function GuideClientPage({
    initialProject,
    initialSteps
}: {
    initialProject: Project,
    initialSteps: Step[]
}) {
    const router = useRouter();
    const { toast } = useToast();

    const [project, setProject] = useState<Project>(initialProject);
    const [steps, setSteps] = useState<Step[]>(initialSteps);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (project.status === 'completed' || project.status === 'failed') return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/projects/${project.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setProject(data.project);
                    setSteps(data.steps || []);

                    if (data.project.status !== project.status) {
                        router.refresh();
                    }
                }
            } catch (e) { console.error(e); }
        }, 3000);

        return () => clearInterval(interval);
    }, [project.id, project.status, router]);

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
                    // Check if imageUrl is already a full URL (if passed from server corrected) or relative
                    // The server passes `imageUrl` as constructed URL in Step 2 of the plan? 
                    // Wait, the plan Step 2 says: 
                    // "imageUrl: step.image_path ? ... : null" -> mapped to clientSteps.
                    // BUT the interface here uses `imageUrl`.
                    // I should ensure I use the value as is, assuming the server passed the correct full URL or relative path handled correctly.
                    // Looking at the user's Step 2 code:
                    // const clientSteps = (steps || []).map(step => ({ ...step, imageUrl: ... full url ... }));
                    // So here `step.imageUrl` will be the full URL.

                    // However, the original code in page.tsx did:
                    // const fullImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.imageUrl}`;

                    // If the server passes the FULL URL in `imageUrl`, I don't need to prepend.
                    // IF the server passes the RELATIVE path, I do.

                    // In the user's Step 2 request:
                    // "imageUrl": step.image_path ? fullurl : null
                    // So I should treat `step.imageUrl` as the full URL if it starts with http, otherwise... 
                    // Wait, let's look at the original `page.tsx`. It expects `imageUrl` to be the filename/path.
                    // The user's Step 2 code says:
                    // const clientSteps = ... imageUrl: fullUrl

                    // So in this NEW `GuideClientPage`, `step.imageUrl` IS the full URL.
                    // I should REMOVE the prepending of `process.env...` if I follow the user's Step 2 exactly.
                    // The user's Step 1 code says:
                    // It COPIES the `exportToMarkdown` function.
                    // "5. 保持原来所有的 exportToMarkdown, copyMarkdown 函数不变 ..."

                    // CONTRADICTION CHECK:
                    // If I keep `exportToMarkdown` unchanged, it will try to prepend the Supabase URL to an already full URL (if Step 2 passes full URL).
                    // Result: `https://supabase.../https://supabase.../filename` -> BROKEN.

                    // I must adjust `exportToMarkdown` and `copyMarkdown` to handle this.
                    // The user said: "保持原来所有的 exportToMarkdown, copyMarkdown 函数不变" (Keep all original functions unchanged).
                    // BUT the user ALSO said in Step 2: 
                    // "const clientSteps = ... imageUrl: fullUrl"

                    // If I follow the user instruction literally, I will break the images in Markdown export.
                    // I will make a small adjustment to fix this: check if it starts with http.

                    const src = step.imageUrl;
                    const fullImageUrl = src?.startsWith('http')
                        ? src
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${src}`;

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
                    const src = step.imageUrl;
                    const fullImageUrl = src?.startsWith('http')
                        ? src
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${src}`;
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

    if (project.status === 'pending' || project.status === 'processing') {
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

    if (project.status === 'failed') {
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
                            onClick={() => toast({ title: "Link copied!", description: window.location.href })}
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
                        {project.title || "Video Guide"}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <a
                            href={project.videoSourceUrl}
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
