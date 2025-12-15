import { Metadata, ResolvingMetadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import GuideClientPage from "./guide-client";

// 1. 动态生成 SEO 标题和描述 (Server Side)
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, video_source_url")
    .eq("id", id)
    .single();

  // 默认兜底
  if (!project) return { title: "Guide Not Found" };

  const pageTitle = project.title
    ? `${project.title} - Step-by-Step Guide`
    : "Video Guide - StepSnip";

  return {
    title: pageTitle,
    description: `Learn how to process this video with our detailed step-by-step guide. Generated from ${project.video_source_url}.`,
    // 这里预埋了国际化链接，指向当前页面
    alternates: {
      canonical: `/guides/${id}`,
    }
  };
}

// 2. 服务端数据获取
export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 获取项目信息
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) return notFound();

  // 获取步骤信息
  const { data: steps } = await supabase
    .from("steps")
    .select("*")
    .eq("project_id", id)
    .order("step_order", { ascending: true });

  // 3. 构建 Google 结构化数据 (Schema Markup)
  // 这是让你的结果在 Google 显示“步骤预览”的关键
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": project.title || "Video Guide",
    "step": steps?.map((step) => ({
      "@type": "HowToStep",
      "position": step.step_order,
      "name": step.title,
      "text": step.description,
      // 如果有图片，必须加上，这对 SEO 极好
      "image": step.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.image_path}`
        : undefined,
      "url": `${process.env.NEXT_PUBLIC_SITE_URL}/guides/${id}#step-${step.step_order}`
    }))
  };

  // 4. 处理图片 URL (为了传给客户端组件显示)
  // Mapping API response (snake_case) to Component Props (camelCase if needed, but the client component uses specific interfaces).
  // Wait, let's check `GuideClientPage` interface again.
  // Interface Step: 
  //   id: string; stepOrder: number; title: string; description: string; timestampSeconds: number; imageUrl: string | null; createdAt: string;
  // Database fields (likely snake_case): 
  //   step_order, timestamp_seconds, image_path, created_at

  // I must map the server data (snake_case) to the client interface (camelCase).

  const clientSteps = (steps || []).map(step => ({
    id: step.id,
    stepOrder: step.step_order,
    title: step.title,
    description: step.description,
    timestampSeconds: step.timestamp_seconds, // Assuming DB column is timestamp_seconds
    imageUrl: step.image_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.image_path}`
      : null,
    createdAt: step.created_at
  }));

  // Project interface in Client:
  //   id, title, videoSourceUrl, videoDurationSeconds, status, errorMessage, creditsCost, createdAt, updatedAt
  // Database fields:
  //   video_source_url, video_duration_seconds, error_message, credits_cost, created_at, updated_at

  const clientProject = {
    id: project.id,
    title: project.title,
    videoSourceUrl: project.video_source_url,
    videoDurationSeconds: project.video_duration_seconds,
    status: project.status,
    errorMessage: project.error_message,
    creditsCost: project.credits_cost,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };

  return (
    <>
      {/* 注入 Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 加载交互组件 */}
      <GuideClientPage
        initialProject={clientProject}
        initialSteps={clientSteps}
      />
    </>
  );
}
