"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Project {
  id: string;
  title: string | null;
  video_source_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  credits_cost: number;
  created_at: string;
  updated_at: string;
}

export function MyProjectsCard() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchProjects, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading your projects...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">No projects yet</div>
            <Button onClick={() => router.push('/')}>
              Create Your First Project
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          My Projects ({projects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/guides/${project.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {project.title || 'Untitled Project'}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.video_source_url}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  {project.credits_cost} credits
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/guides/${project.id}`);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

