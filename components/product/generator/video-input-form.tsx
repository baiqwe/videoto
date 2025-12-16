"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Gift, Sparkles, Zap, Lock } from "lucide-react"; // 🟢 引入图标
import Link from "next/link"; // 🟢 引入 Link

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useCredits } from "@/hooks/use-credits";

const formSchema = z.object({
  videoSourceUrl: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  generationMode: z.enum(['text_only', 'text_with_images']).default('text_with_images'),
});

interface VideoInputFormProps {
  onCreate: (data: any) => Promise<void>;
  isCreating: boolean;
}

export default function VideoInputForm({ onCreate, isCreating }: VideoInputFormProps) {
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUser();
  const { credits: userCredits } = useCredits();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { videoSourceUrl: "", title: "", generationMode: 'text_with_images' as const },
  });

  const creditCost = 10;
  const currentCredits = userCredits?.remaining_credits || 0;
  const hasEnoughCredits = user ? currentCredits >= creditCost : false;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      // 如果未登录用户点击了提交（虽然按钮被禁用了，防卫性编程）
      window.location.href = '/sign-in';
      return;
    }
    await onCreate(values);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* 🟢 1. 强力诱导 Banner (仅未登录显示) */}
      {!user && !userLoading && (
        <div className="mb-6 relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Gift className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                New User Exclusive
                <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-300">
                  Free Trial
                </span>
              </h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                Sign up to get <span className="font-bold text-amber-900">30 Credits</span>, enough to generate
                <span className="font-bold underline decoration-amber-500/50 decoration-2 underline-offset-2 mx-1">3 Free Guides</span>.
                <span className="opacity-80 text-xs block mt-1 sm:inline sm:mt-0 sm:ml-1">
                  (No credit card required)
                </span>
              </p>
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-md shrink-0">
              <Link href="/sign-in">Claim Credits</Link>
            </Button>
          </div>
          {/* 装饰背景 */}
          <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-amber-100/50 rotate-12 pointer-events-none" />
        </div>
      )}

      <Card className="shadow-lg border border-border relative overflow-hidden">
        {/* 顶部高光条 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Turn Video into Guide</CardTitle>
          <CardDescription>
            Paste a YouTube URL and we'll automatically extract key steps with screenshots.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* YouTube URL 输入框 */}
            <div className="space-y-2">
              <Label htmlFor="videoSourceUrl" className="text-base font-medium flex justify-between">
                <span>YouTube URL <span className="text-destructive">*</span></span>
                {/* 🟢 2. 积分状态显示优化 */}
                <span className="text-xs font-normal flex items-center gap-1">
                  {user ? (
                    hasEnoughCredits ? (
                      <span className="text-green-600 flex items-center">
                        <Zap size={12} className="mr-1" /> 余额: {currentCredits} (本次消耗 {creditCost})
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center">
                        余额不足 ({currentCredits}/{creditCost})
                      </span>
                    )
                  ) : (
                    <span className="text-amber-600 flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                      <Gift size={12} className="mr-1" /> 登录立享免费额度
                    </span>
                  )}
                </span>
              </Label>
              <Input
                id="videoSourceUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-12 text-base shadow-sm"
                {...form.register("videoSourceUrl")}
              />
              {form.formState.errors.videoSourceUrl && (
                <p className="text-sm text-destructive mt-1">
                  {String(form.formState.errors.videoSourceUrl.message)}
                </p>
              )}
            </div>

            {/* 标题输入框 (可选) */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">Project Title <span className="text-muted-foreground font-normal text-sm">(Optional)</span></Label>
              <Input
                id="title"
                placeholder="e.g., How to Install Node.js"
                className="h-12 shadow-sm"
                {...form.register("title")}
              />
            </div>

            {/* 模式选择 (保持你的原有代码) */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Generation Mode</Label>
              <RadioGroup
                value={form.watch("generationMode")}
                onValueChange={(value) => form.setValue("generationMode", value as 'text_only' | 'text_with_images')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {/* 样式优化：让选项看起来更可点击 */}
                <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-all cursor-pointer ${form.watch("generationMode") === 'text_with_images' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                  <RadioGroupItem value="text_with_images" id="mode-images" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mode-images" className="font-medium cursor-pointer block">Text + Images</Label>
                    <p className="text-xs text-muted-foreground mt-1">Standard guide with screenshots. (Best for tutorials)</p>
                  </div>
                </div>
                <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-all cursor-pointer ${form.watch("generationMode") === 'text_only' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                  <RadioGroupItem value="text_only" id="mode-text" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mode-text" className="font-medium cursor-pointer block">Text Only</Label>
                    <p className="text-xs text-muted-foreground mt-1">Faster generation, text summary only.</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* 🟢 3. 提交按钮 (文案与状态优化) */}
            <Button
              type="submit"
              disabled={isCreating || (user && !hasEnoughCredits)}
              className={`w-full h-14 text-lg font-semibold transition-all duration-200 shadow-md ${!user ? 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90' : ''
                }`}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Video...
                </div>
              ) : user ? (
                hasEnoughCredits ? (
                  <span className="flex items-center gap-2">
                    Generate Guide <span className="opacity-80 text-sm font-normal">(-{creditCost} Credits)</span>
                  </span>
                ) : (
                  "Insufficient Credits - Recharge to Continue"
                )
              ) : (
                // 未登录状态的按钮文案
                <span className="flex items-center gap-2">
                  Sign In to Get 3 Free Guides <Lock size={16} className="opacity-70" />
                </span>
              )}
            </Button>

            {/* 底部辅助信息 */}
            {!user && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                By clicking the button above, you'll be redirected to sign in with Google.
                <br />Your free credits will be applied automatically.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

