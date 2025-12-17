import { Metadata, ResolvingMetadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
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

  // Fetch related guides
  const { data: relatedGuides } = await supabase
    .from("projects")
    .select("id, title, video_source_url")
    .neq("id", id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(3);

  // 3. 构建 Google 结构化数据 (Schema Markup)
  // 这是让你的结果在 Google 显示“步骤预览”的关键
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "name": project.title || "Video Guide",
        "step": steps?.map((step) => ({
          "@type": "HowToStep",
          "position": step.step_order,
          "name": step.title,
          "text": step.description,
          "image": step.image_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.image_path}`
            : undefined,
          "url": `${process.env.NEXT_PUBLIC_SITE_URL}/guides/${id}#step-${step.step_order}`
        }))
      },
      {
        "@type": "VideoObject",
        "name": project.title || "Video Guide",
        "description": "Original video source for this guide.",
        "contentUrl": project.video_source_url,
        "uploadDate": project.created_at,
        "thumbnailUrl": "https://img.youtube.com/vi/placeholder/maxresdefault.jpg" // Placeholder as extraction is complex here
      }
    ]
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

      {/* Related Guides Section */}
      {relatedGuides && relatedGuides.length > 0 && (
        <div className="container py-12 px-4 md:px-6 border-t mt-12 bg-gray-50/50 dark:bg-gray-900/10">
          <h2 className="text-2xl font-bold mb-6">More Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedGuides.map(guide => (
              <Link key={guide.id} href={`/guides/${guide.id}`} className="group block">
                <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm p-5 hover:shadow-md transition-all hover:border-primary/50">
                  <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">{guide.title || 'Untitled Guide'}</h3>
                  <p className="text-xs text-muted-foreground truncate opacity-70 mb-2">{guide.video_source_url}</p>
                  <div className="text-xs text-primary font-medium">View Guide →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
