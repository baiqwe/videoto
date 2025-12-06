"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PromptEditor() {
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_configs')
        .select('value, description')
        .eq('key', 'gemini_video_prompt')
        .single();
      
      if (error) {
        console.error("Error loading prompt:", error);
        toast({
          title: "Error loading prompt",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setPrompt(data.value || "");
        setDescription(data.description || "");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected error",
        description: "Failed to load prompt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_configs')
        .update({ 
          value: prompt,
          description: description || 'Main prompt for video analysis and article generation'
        })
        .eq('key', 'gemini_video_prompt');

      if (error) {
        console.error("Error saving prompt:", error);
        toast({
          title: "Error saving prompt",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Prompt updated!",
          description: "Next video processing will use this new prompt. No restart needed!",
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Prompt Playground</h1>
          <p className="text-muted-foreground">
            Edit the system prompt used for video analysis. Changes take effect immediately on the next video processing.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Main Editor Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gemini Video Analysis Prompt</CardTitle>
          <CardDescription>
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{video_url}`}</code>,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{duration_formatted}`}</code>, and{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{duration_seconds:.1f}`}</code> as placeholders.
            JSON examples should use double braces: <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{{ }}`}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Optimized for tutorial videos"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Prompt Editor */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Prompt Content
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Enter your prompt here..."
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={savePrompt}
              disabled={saving || !prompt.trim()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Update Live Prompt
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={loadPrompt}
              disabled={loading || saving}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">💡 How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Changes are saved to the database immediately</li>
              <li>The Python Worker loads the prompt on each video processing task</li>
              <li>No code deployment or Worker restart needed</li>
              <li>If the database is unavailable, the Worker falls back to a hardcoded default prompt</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

