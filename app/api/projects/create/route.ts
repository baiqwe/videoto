import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { useCredits } from '@/utils/supabase/subscriptions';
import { headers } from 'next/headers'; // 🟢 新增：用于获取 IP


interface CreateProjectRequest {
  videoSourceUrl: string;
  title?: string;
  generationMode?: 'text_only' | 'text_with_images';
}

// Calculate credits cost based on video duration (10 credits per minute, minimum 10 credits)
function calculateCreditsCost(durationSeconds: number | null): number {
  if (!durationSeconds) {
    return 10; // Default cost for unknown duration
  }
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(10, minutes * 10); // Minimum 10 credits, 10 credits per minute
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 基础 Auth 检查
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProjectRequest = await request.json();
    const { videoSourceUrl, title, generationMode = 'text_with_images' } = body;

    // ... URL 校验逻辑 ...
    if (!videoSourceUrl) {
      return NextResponse.json({ error: 'Missing required field: videoSourceUrl' }, { status: 400 });
    }
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoSourceUrl)) {
      return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 });
    }

    // 2. 获取用户 Customer 信息及订阅状态
    const { data: customer } = await supabase
      .from('customers')
      .select('*, subscriptions(*)')
      .eq('user_id', user.id)
      .single();

    if (!customer) throw new Error('Customer record not found');

    // 3. 🛡️【关键逻辑】防薅羊毛检查
    // 判断是否为付费会员 (有 active 或 trialing 的订阅)
    const isPaidUser = customer.subscriptions?.some(
      (sub: any) => ['active', 'trialing'].includes(sub.status)
    );

    // 🟢 如果是免费用户，强制进行 IP 频率检查
    if (!isPaidUser) {
      const headersList = await headers();
      // 获取真实 IP (兼容 Vercel/Zeabur 等代理环境)
      const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
        headersList.get('x-real-ip') ||
        'unknown';

      // 调用数据库 RPC 函数
      const { data: isAllowed, error: rpcError } = await supabase.rpc('check_ip_rate_limit', {
        client_ip: ip
      });

      if (rpcError) {
        console.error('IP Check Error:', rpcError);
        // 出错时默认放行或阻断，视安全要求而定，这里建议先记录日志放行，或直接阻断
      }

      // 如果返回 false，说明该 IP 今天撸太多了
      if (isAllowed === false) {
        return NextResponse.json(
          {
            error: 'Free trial limit reached for this network today. Please upgrade to remove limits.',
            code: 'IP_LIMIT_EXCEEDED'
          },
          { status: 429 } // Too Many Requests
        );
      }
    }



    // 4. 检查积分余额
    const creditsCost = 10; // 假设固定 10 分
    if (customer.credits < creditsCost) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsCost, available: customer.credits },
        { status: 403 }
      );
    }

    // 5. 创建项目 & 扣除积分
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: title || null,
        video_source_url: videoSourceUrl,
        status: 'pending',
        credits_cost: creditsCost,
        generation_mode: generationMode,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // 扣分
    try {
      await useCredits(customer.id, creditsCost, `Video processing: ${project.id}`);
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      await supabase.from('projects').delete().eq('id', project.id);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        videoSourceUrl: project.video_source_url,
        status: project.status,
        creditsCost: project.credits_cost,
        createdAt: project.created_at,
      },
      message: 'Project created successfully.'
    });

  } catch (error: any) {
    console.error('Create error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

