import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { useCredits } from '@/utils/supabase/subscriptions';

interface CreateProjectRequest {
  videoSourceUrl: string;
  title?: string;
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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create a project.' },
        { status: 401 }
      );
    }

    const body: CreateProjectRequest = await request.json();
    const { videoSourceUrl, title } = body;

    if (!videoSourceUrl) {
      return NextResponse.json(
        { error: 'Missing required field: videoSourceUrl' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format (basic validation)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoSourceUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    // Get customer data to check credits
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer record not found. Please contact support.' },
        { status: 500 }
      );
    }

    // Calculate credits cost (default to 10 credits, will be updated when video duration is known)
    const creditsCost = 10; // Initial cost, will be updated by worker

    // Check if customer has sufficient credits
    if (customer.credits < creditsCost) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits. Please purchase more credits.',
          required: creditsCost,
          available: customer.credits
        },
        { status: 403 }
      );
    }

    // Create project record with pending status
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: title || null,
        video_source_url: videoSourceUrl,
        status: 'pending',
        credits_cost: creditsCost,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project. Please try again.' },
        { status: 500 }
      );
    }

    // Deduct credits (using the utility function)
    try {
      await useCredits(customer.id, creditsCost, `Video processing: ${project.id}`);
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      // Rollback: delete the project if credit deduction fails
      await supabase.from('projects').delete().eq('id', project.id);
      return NextResponse.json(
        { error: 'Failed to process payment. Please try again.' },
        { status: 500 }
      );
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
      message: 'Project created successfully. Processing will begin shortly.',
    });

  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

