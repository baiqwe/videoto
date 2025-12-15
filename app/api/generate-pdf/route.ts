import { NextResponse } from 'next/server';

// 强制指定边缘运行时 (Edge Runtime)
export const runtime = 'edge';

export async function POST() {
  // 暂时屏蔽 PDF 功能，返回服务暂不可用
  return NextResponse.json(
    {
      error: 'PDF generation is coming soon in the next version.',
      details: 'This feature is currently disabled on the Edge environment.'
    },
    { status: 503 }
  );
}