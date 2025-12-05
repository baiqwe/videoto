import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch project with steps
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user owns the project
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch steps for this project
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('project_id', projectId)
      .order('step_order', { ascending: true });

    if (stepsError) {
      console.error('Error fetching steps:', stepsError);
    }

    // Format response
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        videoSourceUrl: project.video_source_url,
        videoDurationSeconds: project.video_duration_seconds,
        status: project.status,
        errorMessage: project.error_message,
        creditsCost: project.credits_cost,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
      steps: (steps || []).map(step => ({
        id: step.id,
        stepOrder: step.step_order,
        title: step.title,
        description: step.description,
        timestampSeconds: step.timestamp_seconds,
        imagePath: step.image_path,
        // Construct full image URL if image_path exists
        imageUrl: step.image_path 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guide_images/${step.image_path}`
          : null,
        createdAt: step.created_at,
      })),
    });

  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update project (for editing title, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { title } = body;

    // Verify project ownership
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const updates: any = {};
    if (title !== undefined) updates.title = title;

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        status: updatedProject.status,
      },
      message: 'Project updated successfully',
    });

  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

