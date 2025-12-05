"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
        setLoading(false);
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

    // Poll every 5 seconds if project is pending or processing
    const interval = setInterval(() => {
      if (project?.status === 'pending' || project?.status === 'processing') {
        fetchProject();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, project?.status, toast]);

  const exportToMarkdown = () => {
    if (!project || steps.length === 0) return;

    setIsExporting(true);
    try {
      let markdown = `# ${project.title || 'Video Guide'}\n\n`;
      markdown += `**Source:** ${project.videoSourceUrl}\n\n`;
      markdown += `---\n\n`;

      steps.forEach((step, index) => {
        markdown += `## Step ${step.stepOrder}: ${step.title}\n\n`;
        if (step.imageUrl) {
          markdown += `![Step ${step.stepOrder}](${step.imageUrl})\n\n`;
        }
        markdown += `${step.description}\n\n`;
        markdown += `*Timestamp: ${formatTime(step.timestampSeconds)}*\n\n`;
        markdown += `---\n\n`;
      });

      // Create blob and download
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
        title: "Exported!",
        description: "Markdown file downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export markdown. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToHTML = () => {
    if (!project || steps.length === 0) return;

    setIsExporting(true);
    try {
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title || 'Video Guide'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
        .timestamp { color: #888; font-size: 0.9em; }
        hr { margin: 30px 0; border: none; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <h1>${project.title || 'Video Guide'}</h1>
    <p><strong>Source:</strong> <a href="${project.videoSourceUrl}">${project.videoSourceUrl}</a></p>
    <hr>`;

      steps.forEach((step) => {
        html += `
    <h2>${step.title}</h2>
    ${step.imageUrl ? `    <img src="${step.imageUrl}" alt="${step.title}">` : ''}
    <p>${step.description}</p>
    <p class="timestamp">Video timestamp: ${formatTime(step.timestampSeconds)}</p>
    <hr>`;
      });

      html += `
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'guide'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exported!",
        description: "HTML file downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export HTML. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyMarkdown = () => {
    if (!project || steps.length === 0) return;

    setIsExporting(true);
    try {
      let markdown = `# ${project.title || 'Video Guide'}\n\n`;
      markdown += `**Source:** ${project.videoSourceUrl}\n\n`;
      markdown += `---\n\n`;

      steps.forEach((step) => {
        markdown += `## ${step.title}\n\n`;
        if (step.imageUrl) {
          markdown += `![${step.title}](${step.imageUrl})\n\n`;
        }
        markdown += `${step.description}\n\n`;
        markdown += `*Video timestamp: ${formatTime(step.timestampSeconds)}*\n\n`;
        markdown += `---\n\n`;
      });

      navigator.clipboard.writeText(markdown);
      toast({
        title: "Copied!",
        description: "Markdown copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy markdown. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Project not found.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="mt-4 w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          {project.title || 'Video Guide'}
        </h1>
        <p className="text-muted-foreground">
          Source: <a href={project.videoSourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {project.videoSourceUrl}
          </a>
        </p>
      </div>

      {/* Status Card */}
      {project.status === 'pending' || project.status === 'processing' ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="font-semibold">
                  {project.status === 'pending' ? 'Queued for Processing' : 'Processing Video'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {project.status === 'pending' 
                    ? 'Your video is in the queue. Processing will begin shortly.'
                    : 'AI is analyzing your video and creating an article-style guide. This may take a few minutes.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : project.status === 'failed' ? (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-destructive mb-2">Processing Failed</h3>
            <p className="text-sm text-muted-foreground">
              {project.errorMessage || 'An error occurred while processing your video. Please try again.'}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Article Content */}
      {project.status === 'completed' && steps.length > 0 && (
        <>
          {/* Export Buttons */}
          <div className="mb-8 flex gap-4 flex-wrap">
            <Button
              onClick={copyMarkdown}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? 'Copying...' : 'Copy Markdown'}
            </Button>
            <Button
              onClick={exportToMarkdown}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? 'Exporting...' : 'Download Markdown'}
            </Button>
            <Button
              onClick={exportToHTML}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? 'Exporting...' : 'Download HTML'}
            </Button>
          </div>

          {/* Article Sections */}
          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.section
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="prose prose-lg max-w-none"
              >
                <Card className="border-l-4 border-l-primary bg-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-2xl font-bold text-foreground">
                        {step.title}
                      </CardTitle>
                      {step.imageUrl && (
                        <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                          📷 Has Image
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {step.imageUrl && (
                      <div className="rounded-lg overflow-hidden border shadow-sm">
                        <img
                          src={step.imageUrl}
                          alt={step.title}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    <div className="prose prose-lg max-w-none">
                      <p className="text-foreground leading-relaxed text-base">
                        {step.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Video timestamp: {formatTime(step.timestampSeconds)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            ))}
          </div>
        </>
      )}

      {project.status === 'completed' && steps.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No steps found for this project.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

