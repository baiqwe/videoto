"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useCredits } from "@/hooks/use-credits";

const formSchema = z.object({
  videoSourceUrl: z.string().url({
    message: "Please enter a valid YouTube URL.",
  }).refine((url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  }, {
    message: "Please enter a valid YouTube URL.",
  }),
  title: z.string().optional(),
  generationMode: z.enum(['text_only', 'text_with_images']).default('text_with_images'),
});

interface VideoInputFormProps {
  onCreate: (data: z.infer<typeof formSchema>) => Promise<void>;
  isCreating: boolean;
}

export default function VideoInputForm({ onCreate, isCreating }: VideoInputFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { credits: userCredits, loading: creditsLoading } = useCredits();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoSourceUrl: "",
      title: "",
      generationMode: 'text_with_images',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onCreate(values);
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  // Check if user has enough credits (default 10 credits)
  const creditCost = 10;
  const currentCredits = userCredits?.remaining_credits || 0;
  const hasEnoughCredits = user ? currentCredits >= creditCost : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="shadow-lg border border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Turn Video into Guide</CardTitle>
          <CardDescription>
            Paste a YouTube URL and we'll automatically extract key steps with screenshots.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* YouTube URL Field */}
            <div className="space-y-2">
              <Label htmlFor="videoSourceUrl" className="text-base font-medium">
                YouTube URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="videoSourceUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-12 text-base"
                {...form.register("videoSourceUrl")}
              />
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {user ? (
                  <>
                    <span>Credits: {creditsLoading ? 'Loading...' : currentCredits}</span>
                    <span className="text-primary">|</span>
                    <span>Cost: {creditCost} credits</span>
                  </>
                ) : (
                  <>
                    <span>🔒 Sign in required</span>
                    <span className="text-primary">|</span>
                    <span>10 credits per video</span>
                  </>
                )}
              </div>
              {form.formState.errors.videoSourceUrl && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.videoSourceUrl.message}
                </p>
              )}
            </div>

            {/* Title Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Project Title (Optional)
              </Label>
              <Input
                id="title"
                placeholder="e.g., How to Install Node.js"
                className="h-12"
                {...form.register("title")}
              />
              <p className="text-sm text-muted-foreground">
                Give your project a name to easily find it later.
              </p>
            </div>

            {/* Generation Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Generation Mode</Label>
              <RadioGroup
                value={form.watch("generationMode")}
                onValueChange={(value) => form.setValue("generationMode", value as 'text_only' | 'text_with_images')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="text_with_images" id="mode-images" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mode-images" className="font-medium cursor-pointer">
                      Text + Images (Recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate structured text with screenshots at key moments. Perfect for tutorials and step-by-step guides.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="text_only" id="mode-text" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mode-text" className="font-medium cursor-pointer">
                      Text Only (Faster)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate structured text content only, without screenshots. Faster processing, ideal for summaries and transcripts.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>AI analyzes your video and identifies key steps</li>
                <li>Automatically captures screenshots at optimal moments</li>
                <li>Generates a step-by-step guide with images and descriptions</li>
                <li>Processing typically takes 2-5 minutes</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isCreating || (user && !hasEnoughCredits) || !user}
              className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating project...
                </div>
              ) : user ? (
                hasEnoughCredits ? (
                  <>
                    Generate Guide ({creditCost} Credits)
                  </>
                ) : (
                  "Insufficient Credits"
                )
              ) : (
                "Sign In to Create Project"
              )}
            </Button>

            {!user && (
              <p className="text-sm text-center text-muted-foreground">
                You need to sign in to create a project.{" "}
                <a href="/sign-in" className="text-primary hover:underline">
                  Sign in here
                </a>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

